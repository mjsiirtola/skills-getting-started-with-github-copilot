document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select so options don't accumulate
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

        // Append card to the list
        activitiesList.appendChild(activityCard);

        // Participants section (rendered via DOM to avoid injection)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.className = "participants-header";
        participantsHeader.textContent = "Participants";
        participantsDiv.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;
            li.appendChild(span);

            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.type = "button";
            delBtn.title = "Remove participant";
            delBtn.innerHTML = "&times;";

            // Delete handler
            delBtn.addEventListener("click", async () => {
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                const resj = await resp.json();

                if (resp.ok) {
                  messageDiv.textContent = resj.message;
                  messageDiv.className = "info";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                  // Refresh activities list to reflect removal
                  await fetchActivities();
                } else {
                  messageDiv.textContent = resj.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                messageDiv.textContent = "Failed to remove participant";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error removing participant:", err);
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });
        } else {
          const empty = document.createElement("div");
          empty.className = "empty-participants";
          empty.textContent = "No participants yet.";
          participantsDiv.appendChild(empty);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activity list so participants update
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
    finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
