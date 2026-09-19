#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Coze Web SDK 连通性测试脚本
=============================================================
用途：直接以服务端身份调用已部署的 Coze 站点 /stream_run 接口，
      验证 token 是否可用、能否正常拿到 SSE 流式响应。

token 读取优先级：
    1) 命令行参数 --token
    2) 环境变量 COZE_TOKEN
    3) 同目录（或上级目录）下的 .env 中的 COZE_TOKEN

用法示例：
    python test_coze.py                       # 使用 .env 里的 token
    python test_coze.py --prompt "什么是正态分布？"
    python test_coze.py --token pat_xxx --verbose
=============================================================
"""

import argparse
import json
import os
import sys

try:
    import requests
except ImportError:
    sys.exit("缺少依赖：pip install requests")

DEFAULT_URL = "https://m2hm37h28q.coze.site/stream_run"
DEFAULT_PROJECT_ID = "7687082916731486217"


def find_env_file():
    """在脚本所在目录、其上级目录、当前工作目录中查找 .env"""
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(here, ".env"),
        os.path.join(os.path.dirname(here), ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def parse_env(path):
    """极简 .env 解析：KEY=VALUE，支持 # 注释与成对引号"""
    env = {}
    with open(path, "r", encoding="utf-8") as fh:
        for raw in fh:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            env[key.strip()] = value
    return env


def resolve_token(cli_token):
    if cli_token:
        return cli_token, "命令行 --token"
    env_token = os.environ.get("COZE_TOKEN")
    if env_token:
        return env_token, "环境变量 COZE_TOKEN"
    path = find_env_file()
    if path:
        data = parse_env(path)
        value = ""
        for key in ("COZE_TOKEN", "coze_token"):
            if data.get(key):
                value = data[key]
                break
        if value and value != "YOUR_TOKEN":
            return value, path
    return "", ""


def mask(token):
    if len(token) <= 16:
        return token[:4] + "***"
    return "{}…{}（{} 字符）".format(token[:8], token[-6:], len(token))


def decode_jwt_payload(token):
    """token 是 JWT 时解码 payload，便于确认手里的令牌是哪一类"""
    parts = token.split(".")
    if len(parts) != 3:
        return None
    try:
        import base64

        seg = parts[1].replace("-", "+").replace("_", "/")
        seg += "=" * (-len(seg) % 4)
        return json.loads(base64.b64decode(seg).decode("utf-8"))
    except Exception:
        return None


def describe_token(token):
    payload = decode_jwt_payload(token)
    if payload is None:
        print("  token 类型：非 JWT（通常是 PAT 明文令牌）")
        return
    session = payload.get("session_context") or {}
    connector = (session.get("connector_info") or {}).get("connector_id")
    print("  token 类型：JWT")
    print("    src : {}".format(payload.get("src", "-")))
    print("    sub : {}".format(payload.get("sub", "-")))
    print("    aud : {}".format(payload.get("aud", "-")))
    print("    connector_id: {}".format(connector if connector else "缺失（Web SDK 要求 2001）"))


def probe_endpoints(token, project_id, timeout):
    """
    用同一个令牌请求几个不同的 Coze 接口，用于区分「令牌本身失效」与「令牌用错了控制面」：

      - 站点接口（<site>.coze.site/stream_run）：Web SDK 站点令牌在这里生效
      - OpenAPI 控制面（api.coze.cn/v1/*）      ：需要 PAT / OAuth 令牌

    注意：站点令牌在 api.coze.cn 上返回 4100 是正常现象，不代表令牌无效。
    """
    endpoints = [
        ("OpenAPI 空间列表", "https://api.coze.cn/v1/workspaces", None),
        (
            "Vibe 项目元信息",
            "https://api.coze.cn/v1/vibe_projects/{}".format(project_id),
            None,
        ),
        (
            "Vibe 项目元信息 + 连接器 2001",
            "https://api.coze.cn/v1/vibe_projects/{}".format(project_id),
            "2001",
        ),
    ]
    print("\n--- 令牌探测（OpenAPI 控制面） ---")
    for name, url, connector in endpoints:
        headers = {"Authorization": "Bearer {}".format(token)}
        if connector:
            headers["X-Coze-Connector-ID"] = connector
        try:
            res = requests.get(url, headers=headers, timeout=timeout)
            body = res.text.replace("\n", " ")[:160]
            print("  [{:>4}] {:<28} {}".format(res.status_code, name, body))
        except requests.RequestException as exc:
            print("  [ERR ] {:<28} {}".format(name, exc))
    print("  提示：若以上为 4100 而下方 /stream_run 为 200，说明令牌是站点令牌、")
    print("        仅对 <site>.coze.site 生效，OpenAPI 需另建 PAT。")


def build_payload(project_id, prompt, session_id):
    return {
        "content": {
            "query": {
                "prompt": [
                    {"type": "text", "content": {"text": prompt}}
                ]
            }
        },
        "type": "query",
        "session_id": session_id,
        "project_id": project_id,
    }


def explain_failure(status, body):
    print("\n--- 失败原因参考 ---")
    if status == 401:
        print("  HTTP 401：身份无效（网关返回 code 4100 即此类）")
        print("  → 首要排查：token 是否带了 czs_ 前缀。服务端只认裸 JWT，")
        print("     本脚本与官方 SDK 都会自动剥离该前缀，检查 .env 里是否有多余字符/换行。")
        print("  → 其次：确认令牌与该站点、该 project_id 属于同一个部署。")
    elif status == 403:
        print("  HTTP 403：身份有效但无权限（常见 code 4101）")
        print("  → 给令牌补上 getMetadata(VibeProject)、run(VibeProject)、")
        print("     convertFileType、uploadFileToStorage 权限。")
    elif status == 404:
        print("  HTTP 404：站点或 project_id 不存在，检查部署状态与 project_id。")
    else:
        print("  HTTP {}：原始响应：{}".format(status, body[:500]))
    print("  排查入口：登录扣子编程 → API & SDK → 授权 → 个人访问令牌（有效期 1~30 天）")


def main():
    parser = argparse.ArgumentParser(description="Coze Web SDK /stream_run 连通性测试")
    parser.add_argument("--url", default=DEFAULT_URL, help="stream_run 接口地址")
    parser.add_argument("--project-id", default=DEFAULT_PROJECT_ID, help="project_id")
    parser.add_argument("--session-id", default="WCB395MjXyroySHV7BRuM", help="会话 ID")
    parser.add_argument("--prompt", default="", help="要发送的文本内容")
    parser.add_argument("--token", default="", help="直接指定 token（优先于 .env）")
    parser.add_argument("--timeout", type=float, default=30.0, help="连接超时（秒）")
    parser.add_argument("--verbose", action="store_true", help="打印完整请求与响应头")
    parser.add_argument(
        "--probe",
        action="store_true",
        help="额外探测若干 OpenAPI 接口，判断令牌是整体失效还是渠道不匹配",
    )
    args = parser.parse_args()

    token, source = resolve_token(args.token)
    if not token:
        sys.exit("未找到 token：请在 .env 中填写 COZE_TOKEN，或用 --token / COZE_TOKEN 指定。")

    print("=" * 62)
    print("接口      : {}".format(args.url))
    print("project_id: {}".format(args.project_id))
    print("session_id: {}".format(args.session_id))
    print("token 来源: {}".format(source))
    print("token     : {}".format(mask(token)))
    describe_token(token)
    print("=" * 62)

    # 实测：官方 Web SDK 在请求头里发送的是去掉 czs_ 前缀的裸 JWT
    auth_token = token[4:] if token.startswith("czs_") else token

    headers = {
        "Authorization": "Bearer {}".format(auth_token),
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    payload = build_payload(args.project_id, args.prompt, args.session_id)

    if args.probe:
        probe_endpoints(auth_token, args.project_id, args.timeout)

    try:
        response = requests.post(
            args.url, headers=headers, json=payload, stream=True, timeout=args.timeout
        )
    except requests.RequestException as exc:
        sys.exit("请求发送失败：{}".format(exc))

    print("status:", response.status_code)
    if args.verbose:
        print("response headers:", dict(response.headers))

    if response.status_code >= 400:
        body = response.text
        print("body:", body)
        explain_failure(response.status_code, body)
        return 1

    print("-" * 62)
    chunks = 0
    for line in response.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        data_text = line[5:].strip()
        if not data_text or data_text == "[DONE]":
            continue
        chunks += 1
        try:
            parsed = json.loads(data_text)
            print(json.dumps(parsed, ensure_ascii=False, indent=2))
        except ValueError:
            print(data_text)

    print("-" * 62)
    print("连通性正常，共收到 {} 条 SSE 数据。".format(chunks))
    return 0


if __name__ == "__main__":
    sys.exit(main())
