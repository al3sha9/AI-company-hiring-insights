from dataclasses import dataclass
from typing import Optional

@dataclass
class RoleSchema:
    title: str
    source_url: str
    category: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    seniority: Optional[str] = None
    work_mode: Optional[str] = None
