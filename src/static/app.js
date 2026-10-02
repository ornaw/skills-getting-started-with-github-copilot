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
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeading);

        const participantList = document.createElement("ul");
        if (details.participants.length > 0) {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");

            const participantName = document.createElement("span");
            participantName.className = "participant-name";
            participantName.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.className = "remove-participant";
            removeButton.type = "button";
            removeButton.textContent = "×";
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            removeButton.title = "Unregister participant";
            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                details.participants.splice(details.participants.indexOf(email), 1);
                participant.remove();
                participantsHeading.textContent = `Participants (${details.participants.length})`;
                activityCard.querySelector(".availability").innerHTML =
                  `<strong>Availability:</strong> ${details.max_participants - details.participants.length} spots left`;

                if (details.participants.length === 0) {
                  const emptyState = document.createElement("li");
                  emptyState.className = "empty";
                  emptyState.textContent = "No participants yet";
                  participantList.appendChild(emptyState);
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
              } catch (error) {
                messageDiv.textContent = error.message || "Failed to unregister participant";
                messageDiv.className = "error";
              }
              messageDiv.classList.remove("hidden");
            });

            participant.append(participantName, removeButton);
            participantList.appendChild(participant);
          });
        } else {
          const emptyState = document.createElement("li");
          emptyState.className = "empty";
          emptyState.textContent = "No participants yet";
          participantList.appendChild(emptyState);
        }

        participantsSection.appendChild(participantList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

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
  });

  // Initialize app
  fetchActivities();
});
