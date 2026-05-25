import httpx
import json

url = "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs"
with httpx.Client() as client:
    res = client.post(url, json={"appliedFacets":{},"limit":1,"offset":0,"searchText":""})
    data = res.json()
    facets = data.get("facets", [])
    for f in facets:
        if f["facetParameter"] == "jobFamilyGroup":
            print("Found categories:")
            for v in f["values"]:
                print(f"  {v['descriptor']} (count: {v['count']}) -> {v['id']}")
            break
