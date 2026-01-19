console.log('Lets write JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder;

/* ================= TIME FORMAT ================= */
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/* ================= GET SONGS ================= */
async function getSongs(folder) {
    currFolder = folder;

    let a = await fetch(`/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {

            /* 🔧 FIX 1: use anchor text, NOT href */
            songs.push(decodeURIComponent(element.textContent.trim()));
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
        <li>
            <img class="invert" width="34" src="img/music.svg" alt="">
            <div class="info">
                <div>${song}</div>
                <div>Sudip Sau</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Attach click to each song
    Array.from(songUL.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerText.trim());
        });
    });

    return songs;
}

/* ================= PLAY MUSIC ================= */
const playMusic = (track, pause = false) => {

    /* 🔧 FIX 2: encode ONLY filename */
    currentSong.src = `/${currFolder}/` + encodeURIComponent(track);

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

/* ================= DISPLAY ALBUMS ================= */
async function displayAlbums() {
    console.log("displaying albums");

    let a = await fetch(`/songs/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];

            let meta = await fetch(`/songs/${folder}/info.json`);
            let data = await meta.json();

            cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
                <div class="play">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M5 20V4L19 12L5 20Z"/>
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg">
                <h2>${data.title}</h2>
                <p>${data.description}</p>
            </div>`;
        }
    }

    // Album click
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(`songs/${card.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

/* ================= MAIN ================= */
async function main() {

    // Load default playlist
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display albums
    await displayAlbums();

    // Play / Pause
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close sidebar
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous
    previous.addEventListener("click", () => {
        currentSong.pause();

        /* 🔧 FIX 3: decode before index lookup */
        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);

        if (index > 0) playMusic(songs[index - 1]);
    });

    // Next
    next.addEventListener("click", () => {
        currentSong.pause();

        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);

        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    // Volume slider
    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = e.target.value / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume img").src = "img/volume.svg";
        }
    });

    // Mute
    document.querySelector(".volume img").addEventListener("click", e => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            e.target.src = "img/mute.svg";
            document.querySelector(".range input").value = 0;
        } else {
            currentSong.volume = 0.1;
            e.target.src = "img/volume.svg";
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
