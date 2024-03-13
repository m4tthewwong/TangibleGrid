/* --------------------------------- socket io stuff --------------------------------- */
let socket = io();

socket.on('connect', function () {
    socket.emit('web connected', 'Web page connected!');
    socket.emit('get data');
});

// Listen for data transmit events from the server
socket.on("data transmit", function(data) {
    socket.emit('web connected', 'Data transmit received!');
    let id = data.id;
    console.log('Data received:', data);

    switch (data.type) {
        case 'add':
            switch (data.bracket) {
                case 'text':
                    // If it exists and the delete flag is not set, prompt the user
                    if (window.oldEditors[id]) { /* Fix up this part...we need to keep the text */
                        let userChoice = confirm("A text bracket already exists. Click 'OK' to keep the existing text, or 'Cancel' to add new text.");
                        if (!userChoice) { // The user chose to add new text, delete the old editor
                            deleteTextbox(id);
                        }
                    }
                    createTextbox(data.x, data.y, data.h, data.w, id);
                    break;
                case 'figure':
                    createImageBox(data.x, data.y, data.h, data.w, id);
                    break;
                case 'video':
                    createVideoBox(data.x, data.y, data.h, data.w, id);
                    break;
                default:
                    console.log('Unknown bracket type for add');
            }
            break;
        case 'delete':
            switch (data.bracket) {
                case 'text':
                    console.log('Textbox deleting');
                    deleteTextbox(id);
                    break;
                case 'figure':
                    console.log('Image box deleting');
                    deleteImageBox(id);
                    break;
                case 'video':
                    console.log('Video box deleting');
                    deleteVideoBox(id);
                    break;
                default:
                    console.log('Unknown bracket type for delete');
            }
            break;
        default:
            console.log('Unknown data type');
    }
});

/* --------------------------------- webpage startup --------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    window.oldEditors = {};
    window.editors = {}; // Store editors
    window.activeEditor = null; // Track active editor
    window.activeEditorId = null; // Track active editor id
});

/* --------------------------------- toolbar --------------------------------- */
// Update toolbar to affect active editor
var toolbarOptions = [
    ['bold', 'italic'],
    [{'size': ['small', false, 'large', 'huge']}],
    [{'color': []}],
    [{'font': []}]
];

var toolbar = document.getElementById('toolbar');

/* Record button */
document.getElementById('start-record-btn').addEventListener('click', function() {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = function(event) {
        var speechToText = event.results[0][0].transcript;
        if (window.activeEditor) {
            window.activeEditor.insertText(window.activeEditor.getLength(), speechToText);
        }
    };

    recognition.onspeechend = function() {
        recognition.stop();
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
    };
});

document.getElementById('toolbar').addEventListener('click', function(event) {
    if (event.target.id === 'start-record-btn') {
        if (window.activeEditor) {
            // Ignore for now - might not need it
        }
    } else {
        // Fix to weird bug: Refocus the active editor with a delay to ensure the blinking cursor remains.
        setTimeout(() => {
            if (window.activeEditor) {
                window.activeEditor.focus();
            }
        }, 10);
    }
});

/* --------------------------------- text box --------------------------------- */
function createTextbox(x, y, h, w, id) {
    // If an editor with this ID already exists, don't create a new one
    if (window.editors[id]) {
        return;
    }

    const editorId = `editor-${id}`;

    const editorDiv = document.createElement('div');
    editorDiv.classList.add('editor');
    editorDiv.style.position = 'absolute';
    const container = document.getElementById('container');
    const containerRect = container.getBoundingClientRect();
    
    // Position
    editorDiv.style.left = `${(y / 12) * containerRect.width}px`;
    editorDiv.style.top = `${(x / 16) * containerRect.height}px`;
    editorDiv.style.width = `${(w / 12) * containerRect.width}px`;
    editorDiv.style.height = `${(h / 16) * containerRect.height}px`;

    container.appendChild(editorDiv);

    const newEditor = new Quill(editorDiv, {
        theme: 'snow',
        modules: {
            toolbar: '#toolbar'
        }
    });

    // Store reference to the editor
    window.editors[editorId] = newEditor;

    // Set this editor as active when clicked
    editorDiv.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering container's click event
        window.activeEditor = window.editors[editorId]; // Set the clicked editor as active
        window.activeEditorId = editorId; // Update activeEditorId to match the clicked editor

        window.activeEditor.focus();
        updateEditorStyles(); // Highlight the active editor
    });
}

function updateEditorStyles() {
    // Iterate through all editors to reset their styles
    Object.keys(window.editors).forEach(id => {
        const editorElement = window.editors[id].container.firstChild;
        if (id === window.activeEditorId) {
            editorElement.style.border = '2px solid #000';
        } else {
            editorElement.style.border = '1px solid #ccc';
        }
    });
}

function deleteTextbox(id) {
    let editor = window.editors[`editor-${id}`];
    if (editor) {
        // Remove the editor from the DOM
        editor.container.remove();
        // Delete the editor from the window.editors object
        delete window.editors[id];
        window.oldEditors[id] = editor;
        // Update any other state as necessary
        if (window.activeEditorId === id) {
            window.activeEditor = null;
            window.activeEditorId = null;
        }
    }
}

/* --------------------------------- figure box --------------------------------- */

function createImageBox(x, y, h, w, id) {
    const boxId = `image-box-${id}`;
    //const boxId = `image-box-${Object.keys(window.editors).length}`;
    const imageBox = document.createElement('div');
    imageBox.id = boxId;
    imageBox.classList.add('image-box');
    imageBox.style.position = 'absolute';

    // Calculate position and size based on container dimensions and provided data
    const container = document.getElementById('container');
    const containerRect = container.getBoundingClientRect();

    imageBox.style.left = `${(y / 12) * containerRect.width}px`;
    imageBox.style.top = `${(x / 16) * containerRect.height}px`;
    imageBox.style.width = `${(w / 12) * containerRect.width}px`;
    imageBox.style.height = `${(h / 16) * containerRect.height}px`;

    imageBox.style.border = '1px dashed #ccc'; // A dashed border for the box
    imageBox.style.cursor = 'pointer';
    imageBox.title = "Click to upload an image";

    // Continue with the rest of your function for setting up the file input and image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // Accept images only
    fileInput.style.opacity = 0; // Hide the file input
    //fileInput.style.position = 'absolute';
    fileInput.style.width = '100%';
    fileInput.style.height = '100%';

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // Set the image as the background of the box
                imageBox.style.backgroundImage = `url(${e.target.result})`;
                imageBox.style.backgroundSize = 'cover'; // Cover ensures the image fits the box
                imageBox.style.backgroundPosition = 'center';
            };

            reader.readAsDataURL(this.files[0]);
        }
    });

    imageBox.appendChild(fileInput);
    container.appendChild(imageBox);
}

function deleteImageBox(id) {
    let box = document.getElementById(`image-box-${id}`);
    if (box) {
        box.remove(); // This removes the image box from the DOM
        delete window.editors[id]; // Also make sure to delete it from the editors object
    }
}

/* --------------------------------- video box --------------------------------- */

function createVideoBox(x, y, h, w, id) {
    const boxId = `video-box-${id}`;
    //const boxId = `video-box-${Object.keys(window.editors).length}`;
    const videoBox = document.createElement('div');
    videoBox.id = boxId;
    videoBox.classList.add('video-box');
    videoBox.style.position = 'absolute';

    // Calculate position and size based on container dimensions and provided data
    const container = document.getElementById('container');
    const containerRect = container.getBoundingClientRect();

    videoBox.style.left = `${(y / 12) * containerRect.width}px`;
    videoBox.style.top = `${(x / 16) * containerRect.height}px`;
    videoBox.style.width = `${(w / 12) * containerRect.width}px`;
    videoBox.style.height = `${(h / 16) * containerRect.height}px`;

    videoBox.style.border = '1px dashed #ccc'; // A dashed border for the box
    videoBox.style.cursor = 'pointer';
    videoBox.title = "Click to upload a video";

    // Create a hidden file input for video uploads
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/*'; // Accept videos only
    fileInput.style.opacity = 0; // Hide the file input
    fileInput.style.width = '100%';
    fileInput.style.height = '100%';

    // Create a video element to play the uploaded video
    const videoElement = document.createElement('video');
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoElement.controls = true; // Show video controls

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const url = URL.createObjectURL(this.files[0]);
            videoElement.src = url;
            videoBox.appendChild(videoElement); // Add the video element to the box
        }
    });

    videoBox.appendChild(fileInput); // Add the file input to the box for uploading
    container.appendChild(videoBox); // Add the video box to the container
}

function deleteVideoBox(id) {
    let box = document.getElementById(`video-box-${id}`);
    if (box) {
        box.remove(); // This removes the video box from the DOM
        delete window.editors[id]; // Also make sure to delete it from the editors object
    }
}