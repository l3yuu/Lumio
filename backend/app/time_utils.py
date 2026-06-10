from datetime import datetime, timezone, timedelta

PH_TIMEZONE = timezone(timedelta(hours=8), name="PHT")


def now_ph() -> datetime:
    return datetime.now(PH_TIMEZONE)


def now_ph_naive() -> datetime:
    return now_ph().replace(tzinfo=None)


def today_ph_str() -> str:
    return now_ph().strftime("%Y-%m-%d")
