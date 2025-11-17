const adCreatorForm = document.getElementById("ad-creator-form");
const videoPlayer = document.getElementById("video-player");
const videoContainer = document.getElementById("video-container");

adCreatorForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const campaignName = adCreatorForm["campaign-name"].value;
  const videoScript = adCreatorForm["video-script"].value;

  try {
    const response = await fetch("/.netlify/functions/generate-longcat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoScript }),
    });

    if (response.ok) {
      const { videoUrl } = await response.json();
      videoPlayer.src = videoUrl;
      videoContainer.style.display = "block";
    } else {
      const data = await response.json();
      alert(data.message);
    }
  } catch (error) {
    console.error("Error generating video:", error);
    alert("An error occurred. Please try again.");
  }
});
