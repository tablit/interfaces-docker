let choreo_dropdown_template;
let example_dropdown_template;
let editor;
let oScript;
let oScriptText;
let DATA;
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

let websocket_opened = false;
let LIVEMODE = false;

$(document).on("choreo-dropdown-load", function(event) {
    $.getJSON("choreo/fetch", function(data) {
        let dropdown_html = choreo_dropdown_template(data);
        $("#choreo_dropdown").html(dropdown_html);
        $("#records_dropdown").toggleClass('disabled');
        if (data.choreos.length) {
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

    editor = CodeMirror(
        $("#editor")[0],
        {
            value: EXAMPLES["stickman"],
            mode:  "javascript",
            lineNumbers: true,
        }
    )
    editor.setOption("theme", "material");
    // https://stackoverflow.com/a/39963707
    var $sel = $('#example_chooser').on('change', function(){
        if (confirm('Unsaved changes will be lost!')) {
            // store new value        
            $sel.trigger('update')
            editor.setValue(EXAMPLES[$("#example_chooser").val()])
        } else {
             // reset
             $sel.val( $sel.data('currVal') )
        }
    }).on('update', function(){
        $(this).data('currVal', $(this).val())
    }).trigger('update');

    $("#run_code").click(runCode);

    $("#mode_toggle_btn").click(toggle_mode);
    $("#toggle_adv_live_btn").click(toggle_adv_live);

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
    if (btn.text() == 'Live Mode') {
        btn.text('DB Mode');
    } else {
        btn.text('Live Mode');
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
    $(document).trigger('data-loaded');
    $(`a.dropdown-item[data-choreo-id="${data.choreo_id}"]`).toggleClass('active');
    $("#data_loading").hide();
    $("#run_code").toggleClass('disabled');
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

    /*
    if ($("#numposes").val()) {
        num_poses = $("#numposes").val()
    }
    */
    let num_poses = 1;
  const vision = await FilesetResolver_1.forVisionTasks(
    "/lib/wasm"
  );

  let model_path = "/lib/models/pose_landmarker_" + $("#model_chooser").val() + ".task"

  poseLandmarker = await PoseLandmarker_1.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: model_path, //`/lib/models/pose_landmarker_full.task`,
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    numPoses: num_poses,
    minPoseDetectionConfidence: $("#minPoseDetectionConfidence").val(),
    minPosePresenceConfidence: $("#minPosePresenceConfidence").val(),
    minTrackingConfidence: $("#minTrackingConfidence").val(),
  });
  console.log("poseLandmarker initialized!");
  //$("#start_scan").prop("disabled", false);
};

// Enable the live webcam view and start detection.
function enableCam(event) {
    LIVEMODE = true;
  if (!poseLandmarker) {
    console.log("Wait! poseLandmaker not loaded yet.");
    return;
  }

    videoWidth = "640px";
    videoHeight = "480px";

  if (webcamRunning === true) {
      webcamRunning = false;
      broadcast_running = false;
      $("#broadcast_scan").prop("disabled", true);
      $("#bc_not_running").show();
      $("#bc_running").hide();

  } else {
      webcamRunning = true;
      if (websocket_opened) {
          $("#broadcast_scan").prop("disabled", false);
      }
  }

  // getUsermedia parameters.
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

    /*
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
  }
  */
    //await poseLandmarker.setOptions({ runningMode: "VIDEO" });

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
      DATA = result.landmarks;
      if (broadcast_running) {
        /// XXX: Make landmarks pickable!
        //let to_send = JSON.stringify(result.landmarks);
        //websocket.send(to_send);
      }
    });
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}