from alibabacloud_dm20151123.client import Client as DmClient
from alibabacloud_dm20151123.models import SingleSendMailRequest
from alibabacloud_tea_openapi import models as open_api_models
import os


def send_email_code(email: str, code: str):
    config = open_api_models.Config(
        access_key_id=os.getenv("ALIYUN_ACCESS_KEY_ID"),
        access_key_secret=os.getenv("ALIYUN_ACCESS_KEY_SECRET"),
        endpoint="dm.aliyuncs.com",
    )
    client = DmClient(config)

    request = SingleSendMailRequest(
        account_name=os.getenv("ALIYUN_MAIL_FROM"),  # 如 no-reply@xxx.com
        address_type=1,
        to_address=email,
        subject="【房价预测系统】登录验证码",
        html_body=f"""
        <p>您的登录验证码是：</p>
        <h2>{code}</h2>
        <p>5 分钟内有效，请勿泄露。</p>
        """,
    )

    client.single_send_mail(request)
