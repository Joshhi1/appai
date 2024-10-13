const configs = {
    APIs: ["https://nash-rest-api.onrender.com/gpt4o"],
    imgur: {
        api: "https://api.imgur.com/3/upload",
        clientId: "Client-Id 6bc5fd51c813512",
    }
}

const menuIcon = document.querySelector('.menuIcon');
const navLinks = document.querySelector('.navLinks');

menuIcon.onclick = () => {
    if (navLinks.offsetHeight == 0) {
        navLinks.style.height = "165px";
        menuIcon.classList.add("fa-xmark");
    } else {
        navLinks.style.height = "0";
        menuIcon.classList.remove("fa-xmark");
    }
}

function closeMenu() {
    navLinks.style.height = "0";
    menuIcon.classList.remove("fa-xmark");
}

const inputField = document.querySelector(".inputField");
const cleo = document.querySelector(".cleoContents");

// just ignore this one :)
function changePadding() {
    cleo.style.padding = `0 1rem ${inputField.offsetHeight + 4}px`;
}
changePadding();
window.addEventListener("resize", () => {
    changePadding();
});

const imageInput = document.querySelector('input[type="file"]');
const addImageBtn = document.querySelector('.addImage');

addImageBtn.onclick = () => {
    document.querySelector('.inputImageContainer').classList.toggle('toggleAddImage');
    if (document.querySelector('.imgBtn').classList[2] == 'fa-image') {
        document.querySelector('.imgBtn').classList.remove('fa-image');
        document.querySelector('.imgBtn').classList.add('fa-arrow-down');
        document.querySelector('.slideText').style.visibility = 'visible';
    } else {
        document.querySelector('.imgBtn').classList.remove('fa-arrow-down');
        document.querySelector('.imgBtn').classList.add('fa-image');
        document.querySelector('.slideText').style.visibility = 'hidden';
    }
}

// user prompts
const cleoContents = document.querySelector('.cleoContents');
const prompt = document.querySelector('.prompt');
const sendPrompt = document.querySelector('.sendPrompt');

sendPrompt.onclick = () => {
    if (prompt.value == '') return;
    const image = imageInput.files[0];
    if (image) {
        const reader = new FileReader();
        reader.onload = (e) => {
            element = document.createElement("div");
            element.setAttribute("class", "alignPrompt");
            let timeNow = getTime();
            element.innerHTML = `
            <div class="promptCleo">
                <img src="${e.target.result}" />
                <p>${prompt.value}</p>
                <div class="copyDetails" onclick="copyToClipboard(this)">
                    <p class="time">${timeNow[0]} : ${timeNow[1]} ${timeNow[2]}</p>
                    <div class="copy copyBtn">
                        <i class="fa-solid fa-copy"></i>
                        <p>copy</p>
                    </div>
                </div>
            </div>`;
            cleoContents.appendChild(element);
            scrollBottom();
            handlePrompt(prompt.value);
            prompt.value = "";
        }
        reader.readAsDataURL(image);
    } else {
        const element = document.createElement("div");
        element.setAttribute("class", "alignPrompt");
        let timeNow = getTime();
        element.innerHTML = `
        <div class="promptCleo">
            <p>${prompt.value}</p>
            <div class="copyDetails" onclick="copyToClipboard(this)">
                <p class="time">${timeNow[0]} : ${timeNow[1]} ${timeNow[2]}</p>
                <div class="copy copyBtn">
                    <i class="fa-solid fa-copy"></i>
                    <p>copy</p>
                </div>
            </div>
        </div>`;
        cleoContents.appendChild(element);
        scrollBottom();
        handlePrompt(prompt.value);
        prompt.value = "";
    }
}

const first = document.createElement("div");
first.setAttribute("class", "cleoResponse");
let oras = getTime();
first.innerHTML = `
    <p>Hello there! How can I assist you today?</p>
    <div class="copyDetails" onclick="copyToClipboard(this)">
        <p class="time">${oras[0]} : ${oras[1]} ${oras[2]}</p>
        <div class="copy copyBtn">
            <i class="fa-solid fa-copy"></i>
            <p>copy</p>
        </div>
    </div>`;
cleoContents.appendChild(first);

prompt.onfocus = () => {
    if (imageInput.files.length > 0) {
        document.querySelector('.inputImageContainer').classList.add('toggleAddImage');
        document.querySelector('.imgBtn').classList.remove('fa-image');
        document.querySelector('.imgBtn').classList.add('fa-arrow-down');
        document.querySelector('.slideText').style.visibility = 'visible';
    }
}

async function handlePrompt(question) {
    const response = document.createElement("div");
    response.setAttribute("class", "cleoResponse cleoResponseWidth");
    response.innerHTML = '<div class="loader"></div>';
    setTimeout(() => {
        cleoContents.appendChild(response);
        scrollBottom();
    }, 1000);
    
    document.querySelector('.inputImageContainer').classList.remove('toggleAddImage');
    document.querySelector('.slideText').style.visibility = 'hidden';
    document.querySelector('.imgBtn').classList.remove('fa-arrow-down');
    document.querySelector('.imgBtn').classList.add('fa-image');
    
    const id = localStorage.getItem('id') || 0;
    
    try {
        const image = imageInput.files[0];
        if (image) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const buffer = e.target.result;
                const imageUrl = await getImageUrl(buffer);
                imageInput.value = null;
                if (imageUrl) {
                    try {
                        const data = await getAnswers(question, id, imageUrl);
                        let timeNow = getTime();
                        response.style.minWidth = '10rem';
                        response.innerHTML = `
                        <pre>${data.response}</pre>
                        <div class="copyDetails" onclick="copyToClipboard(this)">
                            <p class="time">${timeNow[0]} : ${timeNow[1]} ${timeNow[2]}</p>
                            <div class="copy copyBtn">
                                <i class="fa-solid fa-copy"></i>
                                <p>copy</p>
                            </div>
                        </div>`;
                        if (data.id) localStorage.setItem('id', data.id);
                        scrollBottom()
                    } catch (e) {
                        showErrorMessage(response);
                    }
                }
            }
            reader.readAsArrayBuffer(image);
        } else {
            const data = await getAnswers(question, id);
            let timeNow = getTime();
            response.style.minWidth = '10rem';
            response.innerHTML = `
                <pre>${data.response}</pre>
                <div class="copyDetails" onclick="copyToClipboard(this)">
                    <p class="time">${timeNow[0]} : ${timeNow[1]} ${timeNow[2]}</p>
                    <div class="copy copyBtn">
                        <i class="fa-solid fa-copy"></i>
                        <p>copy</p>
                    </div>
                </div>`;
            if (data.id) localStorage.setItem('id', data.id);
            scrollBottom()
        }
    } catch (e) {
console.log(e)
        showErrorMessage(response);
    }
}

async function getAnswers(question, id, img) {
    if (img) {
        for (api of configs.APIs) {
            const {
                data
            } = await axios.get(`${api}`, {
                params: {
                    prompt: question,
                    url: img,
                    id,
                }
            });
            if (data) return data;
        }
    } else {
        for (api of configs.APIs) {
            const {
                data
            } = await axios.get(`${api}`, {
                params: {
                    prompt: question,
                    id,
                }
            });
            if (data) return data;
        }
    }
    throw new Error('Error getting answers.');
}

async function showErrorMessage(response, message) {
    let timeNow = getTime();
    response.innerHTML = `
    <pre>${message ? message : 'Unable to connect to the server.'}</pre>
    <div class="copyDetails" onclick="copyToClipboard(this)">
        <p class="time">${timeNow[0]} : ${timeNow[1]} ${timeNow[2]}</p>
        <div class="copy copyBtn">
            <i class="fa-solid fa-copy"></i>
            <p>copy</p>
        </div>
    </div>`;
    scrollBottom()
}

async function getImageUrl(fileBuffer) {
    try {
        const {
            data: img
        } = await axios.post(configs.imgur.api, fileBuffer, {
              headers: {
                  "Authorization": configs.imgur.clientId,
                  "Content-Type": "application/octet-stream"
              }
        });
        return img.data.link;
    } catch (e) {
        return null;
    }
}

function scrollBottom() {
    cleoContents.scrollTop = cleoContents.scrollHeight
}

function getTime() {
    const Time = new Date();
    let hours = Time.getHours();
    let minutes = Time.getMinutes();
    let seconds = Time.getSeconds();
    let mode = null;
    
    if (hours == 0) {
        hours = 12;
        mode = "AM";
    } else if (hours > 12) {
        hours = hours - 12;
        mode = "PM";
    } else {
        mode = "AM";
    }
    
    if (String(minutes).length == 1) {
        minutes = `0${minutes}`;
    }
    
    return [hours, minutes, mode]
    
}

function clearImageInput() {
    imageInput.value = null;
}

function copyToClipboard(e) {
    const text = e.previousElementSibling.innerText;
    navigator.clipboard.writeText(text);
    e.lastElementChild.lastElementChild.innerText = "copied";
}