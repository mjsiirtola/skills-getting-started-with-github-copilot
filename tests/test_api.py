from copy import deepcopy

import httpx
import pytest
import pytest_asyncio

from src import app as app_module


@pytest.fixture(autouse=True)
def reset_activities():
    original = deepcopy(app_module.activities)
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original))
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original))


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=app_module.app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client


@pytest.mark.asyncio
async def test_get_activities_returns_seed_data(client):
    response = await client.get("/activities")

    assert response.status_code == 200
    assert "Chess Club" in response.json()
    assert response.json()["Chess Club"]["participants"]


@pytest.mark.asyncio
async def test_signup_for_activity_adds_participant(client):
    response = await client.post(
        "/activities/Chess Club/signup",
        params={"email": "newstudent@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Signed up newstudent@mergington.edu for Chess Club"
    assert "newstudent@mergington.edu" in app_module.activities["Chess Club"]["participants"]


@pytest.mark.asyncio
async def test_signup_rejects_duplicate_email(client):
    response = await client.post(
        "/activities/Chess Club/signup",
        params={"email": "michael@mergington.edu"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student is already signed up for this activity"


@pytest.mark.asyncio
async def test_signup_returns_404_for_unknown_activity(client):
    response = await client.post(
        "/activities/Unknown Activity/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


@pytest.mark.asyncio
async def test_unregister_removes_participant(client):
    response = await client.delete(
        "/activities/Chess Club/signup",
        params={"email": "michael@mergington.edu"},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Removed michael@mergington.edu from Chess Club"
    assert "michael@mergington.edu" not in app_module.activities["Chess Club"]["participants"]
