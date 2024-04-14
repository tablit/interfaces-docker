let choreo_dropdown_template;
let example_dropdown_template;
let editor;
let oScript;
let oScriptText;
let DB_DATA;
let sketch;
let stage;
let cur_choreo_id;

let video;
let canvasElement;
let canvasCtx;
let drawingUtils;

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
let lastVideoTime = -1;

let videoWidth;
let videoHeight;

let webcamRunning = false;
let broadcast_running = false;

let websocket;
let websocket_opened = false;

let params = new URLSearchParams(document.location.search);


$(document).on("choreo-dropdown-load", function(event) {
    $.getJSON("choreo/fetch", function(data) {
        let dropdown_html = choreo_dropdown_template(data);
        $("#choreo_dropdown").html(dropdown_html);
        $("#records_dropdown").toggleClass('disabled');
        let chroeo_id = params.get("choreo_id");
        if (chroeo_id) {
            load_data(chroeo_id);
        } else if (data.choreos.length) {
            load_data(data.choreos[0].choreo_id);
        }
    })
})

$(document).on("example-dropdown-load", function(event) {
    $.getJSON("get_examples", function(data) {
        let select_html = example_dropdown_template(data)
        $("#examples_dropdown").html(select_html)
    })
})

$(function() {

    let bp_modal_el = document.querySelector('#bp_info_modal')
    let bp_modal = bootstrap.Modal.getOrCreateInstance(bp_modal_el)
    let js_modal_el = document.querySelector('#js_info_modal')
    let js_modal = bootstrap.Modal.getOrCreateInstance(js_modal_el)
    let manual_modal_el = document.querySelector('#manual_modal')
    let manual_modal = bootstrap.Modal.getOrCreateInstance(manual_modal_el)

    $("#show_bp_model").click(function(event) {
        bp_modal.show()
    })

    $("#show_js_info").click(function(event) {
        js_modal.show()
    })

    $("#show_manual").click(function(event) {
        manual_modal.show()
    })

    hljs.highlightAll();

    $.get(
        "choreo_dropdown_select_pt",
        function(data) {
            choreo_dropdown_template = Handlebars.compile(data)
            $(document).trigger("choreo-dropdown-load")
        }
    )

    $.get(
        "example_dropdown_select_pt",
        function(data) {
            example_dropdown_template = Handlebars.compile(data)
            $(document).trigger("example-dropdown-load")
        }
    )

    example_id = params.get("example_id");
    editor = CodeMirror(
        $("#editor")[0],
        {
            value: example_id ? EXAMPLES[example_id] : EXAMPLES["stickman"],
            mode:  "javascript",
            lineNumbers: true,
            extraKeys: {"Ctrl-Space": "autocomplete"},
            indentUnit: 4,
        }
    )
    editor.setOption("theme", "material");
    editor.setOption("hintOptions", {
        completeOnSingleClick: false,
        closeOnUnfocus: false,
        additionalContext: {p: p5.prototype},
        useGlobalScope: true,
    })

    $("#run_code").click(runCode);
    $("#mode_toggle_btn").click(toggle_mode);
    $("#toggle_adv_live_btn").click(toggle_adv_live);
    $("#broadcast_scan").click(start_broadcast);
    $("#connect_ws_btn").click(connect_ws);
    $("#download_code").click(function(event) {
        saveTextAsFile(editor.getValue(), 'p5_code.js')
    })

    $("#import_code").click(function(event) {
        $("#import_file").click();
    })

    $("#import_file").on("change", (event) => {
        let import_file = $("#import_file")[0].files[0]
        if (!import_file) {
            alert("Please select a file!")
            return
        }
        let import_code = ""
        let fileReader = new FileReader()
        fileReader.onload = function () {
            import_code = fileReader.result
            editor.setValue(import_code)
        }
        fileReader.readAsText(import_file)        
    })
    
    $("#export_toggle").on("change", (event) => {
        $("#download_png").toggleClass("disabled");
        $("#download_svg").toggleClass("disabled");
        $("#export_alert").toggleClass("d-none");
        if ($("#export_toggle").is(':checked')) {
            p5_MODE = 'svg';
        } else {
            p5_MODE = 'p2d';
        }
    })

    $("#download_png").click(downloadSVGAsPNG);
    $("#download_svg").click(downloadSVGAsText);

    // If webcam supported, add event listener to button for when user
    // wants to activate it.
    if (hasGetUserMedia()) {
        $("#start_cam_btn").click(enableCam);
    } else {
        console.warn("getUserMedia() is not supported by your browser");
        $("#start_cam_btn").prop("disabled", true);
    }

    video = document.getElementById("webcam");
    canvasElement = document.getElementById("output_canvas");
    canvasCtx = canvasElement.getContext("2d");
    drawingUtils = new DrawingUtils_1(canvasCtx);
    $("#load_model").click((event) => {
        webcamRunning = false;
        broadcast_running = false;
        $("#start_scan_btn").toggleClass("disabled");
        $("#bc_not_running").show();
        $("#bc_running").hide();
        createPoseLandmarker();
    })

    createPoseLandmarker();
})

function runCode(event) {

    if (stage) {
        stage.remove()
    }

    $("#p5_stage").empty()

    let jscode = editor.getValue()

    if(oScript) {
        oScript.remove()
    }

    oScript = document.createElement("script")
    oScriptText = document.createTextNode(jscode)
    oScript.appendChild(oScriptText)
    document.body.appendChild(oScript)    

}

function select_choreo(event) {
    let elem = $(event.target);
    cur_choreo_id = elem.data('choreo-id');
    $("a.dropdown-item.active[data-choreo-id]").toggleClass('active');
    //elem.toggleClass('active');

    $("#data_loading").show();
    $("#run_code").toggleClass('disabled');
    load_data(cur_choreo_id);
}

function toggle_mode(event) {
    let btn = $(event.target);

    LIVEMODE = !LIVEMODE;

    if (LIVEMODE) {
        btn.text('DB Mode');
        DATA = [];
    } else {
        btn.text('Live Mode');
        DATA = DB_DATA;
    }
    $("#database_tools").toggleClass("d-none");
    $("#live_tools").toggleClass("d-none");
}

function toggle_adv_live(event) {
    $("#ws_settings").toggleClass("d-none");
    $("#model_settings").toggleClass("d-none");
}

function data_loaded(data) {
    DATA = data.choreo_json;
    DB_DATA = data.choreo_json;
    $(document).trigger('data-loaded');
    $(`a.dropdown-item[data-choreo-id="${data.choreo_id}"]`).toggleClass('active');
    $("#data_loading").hide();
    $("#run_code").toggleClass('disabled');
    $("#selected_record").html(`${data.choreo_name} by ${data.choreo_author}`);
    console.log("Record loaded!");
}

function load_data(choreo_id) {
    $.getJSON(
        'choreo/fetch_playground',
        {
            choreo_id: choreo_id,
        },
        data_loaded
    )
}

const createPoseLandmarker = async () => {

    let num_poses = 1;

    if ($("#numposes").val()) {
        num_poses = $("#numposes").val()
    }
    const vision = await FilesetResolver_1.forVisionTasks(
        "/lib/wasm"
    );

    let model_path = "/lib/models/pose_landmarker_" + $("#model_chooser").val() + ".task"

    poseLandmarker = await PoseLandmarker_1.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: model_path,
            delegate: "GPU"
        },
        runningMode: 'VIDEO',
        numPoses: num_poses,
        minPoseDetectionConfidence: $("#minPoseDetectionConfidence").val(),
        minPosePresenceConfidence: $("#minPosePresenceConfidence").val(),
        minTrackingConfidence: $("#minTrackingConfidence").val(),
    });

    console.log("poseLandmarker initialized!");
    $("#start_scan_btn").toggleClass("disabled");

};

// Enable the live webcam view and start detection.
function enableCam(event) {

    if (!poseLandmarker) {
        console.log("Wait! poseLandmaker not loaded yet.");
        return;
    }

    videoWidth = "640px";
    videoHeight = "360px";

    if (webcamRunning === true) {
        webcamRunning = false;
        broadcast_running = false;
        $("#broadcast_scan").prop("disabled", true);
        $("#bc_not_running").show();
        $("#bc_running").hide();
        $(video).hide();
        $(canvasElement).hide();
    
    } else {
        webcamRunning = true;
        if (websocket_opened) {
          $("#broadcast_scan").prop("disabled", false);
        }
        $(video).show();
        $(canvasElement).show();
    }

    const constraints = {
        video: true
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });


}

async function predictWebcam() {
    canvasElement.style.height = videoHeight;
    video.style.height = videoHeight;
    canvasElement.style.width = videoWidth;
    video.style.width = videoWidth;

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            for (const landmark of result.landmarks) {
                drawingUtils.drawLandmarks(landmark, {
                  radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
                });
                drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
            }
            canvasCtx.restore();
            if (LIVEMODE) {
                DATA = result.landmarks;
            }
            if (broadcast_running) {
                /// XXX: Make landmarks pickable!
                let to_send = JSON.stringify(result.landmarks);
                websocket.send(to_send);
            }
        });
    }

    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }

}

function start_broadcast(event) {
    if (websocket_opened && !broadcast_running) {
        broadcast_running = true;
        console.log("Broadcast started!");
        $("#bc_not_running").hide();
        $("#bc_running").show();
    } else {
        broadcast_running = false;
        console.log("Broadcast stopped!");
        $("#bc_not_running").show();
        $("#bc_running").hide();
    }
}

function connect_ws(event) {
    ws_addr = $("#ws_addr").val();
    websocket = new WebSocket(ws_addr);

    websocket.addEventListener("open", (event) => {
        websocket_opened = true;
        $("#ws_not_connected").hide();
        $("#ws_connected").show();
        if (webcamRunning) {
            $("#broadcast_scan").prop("disabled", false);
        }
    });
}

function select_example(event) {
    let selected = $(event.target);
    editor.setValue(EXAMPLES[selected.data('example-id')]);
}

function saveTextAsFile(textToWrite, fileNameToSaveAs) {
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'}); 
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL !== null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function downloadSVGAsText() {
    const svg = document.querySelector('svg');
    if (!svg) {
        alert("No image found, aborting ...")
        return
    }
    const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)));
    const a = document.createElement('a');
    const e = new MouseEvent('click');
    a.download = 'download.svg';
    a.href = 'data:image/svg+xml;base64,' + base64doc;
    a.dispatchEvent(e);
}

function downloadSVGAsPNG(e){
    const canvas = document.createElement("canvas");
    const svg = document.querySelector('svg');
    if (!svg) {
        alert("No image found, aborting ...")
        return
    }
    const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)));
    const w = parseInt(svg.getAttribute('width'));
    const h = parseInt(svg.getAttribute('height'));
    const img_to_download = document.createElement('img');
    img_to_download.src = 'data:image/svg+xml;base64,' + base64doc;
    console.log(w, h);
    img_to_download.onload = function () {    
        canvas.setAttribute('width', w);
        canvas.setAttribute('height', h);
        const context = canvas.getContext("2d");
        context.drawImage(img_to_download,0,0,w,h);
        const dataURL = canvas.toDataURL('image/png');
        if (window.navigator.msSaveBlob) {
          window.navigator.msSaveBlob(canvas.msToBlob(), "download.png");
          e.preventDefault();
        } else {
          const a = document.createElement('a');
          const my_evt = new MouseEvent('click');
          a.download = 'download.png';
          a.href = dataURL;
          a.dispatchEvent(my_evt);
        }
    }  
}