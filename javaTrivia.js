const apiKey = "EuIXiUAafjs0DIfbVfMx3ysakGLHY1ezVO2oduAd";
const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        document.getElementById("apod-title").textContent = data.title;
        document.getElementById("apod-date").textContent = `Date: ${data.date}`;
        document.getElementById("apod-explanation").textContent = data.explanation;

        const mediaDiv = document.getElementById("apod-media");
        if (data.media_type === "image") {
            const img = document.createElement("img");
            img.src = data.url;
            mediaDiv.appendChild(img);
        } else if (data.media_type === "video") {
            const iframe = document.createElement("iframe");
            iframe.src = data.url;
            iframe.width = "100%";
            iframe.height = "400";
            iframe.allowFullscreen = true;
            mediaDiv.appendChild(iframe);
        }
    })
    .catch(error => {
        document.getElementById("apod-container").textContent = "Failed to load APOD.";
        console.error(error);
    });