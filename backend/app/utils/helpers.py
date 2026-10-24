from typing import Any, Dict, List, Optional
import math


def paginate_list(items: List[Any], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Helper to paginate in-memory lists."""
    total = len(items)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def clean_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """Removes None values from dictionary."""
    return {k: v for k, v in d.items() if v is not None}
