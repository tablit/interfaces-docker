let choreo_dropdown_template;
let example_dropdown_template;
let editor;
let oScript;
let oScriptText;
let DATA;
let sketch;
let stage;
let cur_choreo_id;


$(document).on("choreo-dropdown-load", function(event) {
    $.getJSON("choreo/fetch", function(data) {
        let dropdown_html = choreo_dropdown_template(data)
        $("#choreo_dropdown").html(dropdown_html)
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
})

function runCode(event) {
    //$("#data_loading").show()

    if (stage) {
        stage.remove()
    }

    $("#p5_stage").empty()

    let choreo_id = $("#choreo_id").val()

    if (cur_choreo_id !== choreo_id) {
        $.getJSON(
            'choreo/fetch_playground',
            {
                choreo_id: choreo_id,
            },
            function( data ) {
                cur_choreo_id = choreo_id
                DATA = data.choreo_json
                run_from_cm()
            }
        )    

    } else {
        run_from_cm()
    }

}

function run_from_cm() {

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
    elem.toggleClass('active');
    console.log(cur_choreo_id);
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