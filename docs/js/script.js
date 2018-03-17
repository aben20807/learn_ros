// Connecting to ROS
// -----------------
var ros = new ROSLIB.Ros();

// If there is an error on the backend, an 'error' emit will be emitted.
ros.on('error', function(error) {
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('error').style.display = 'inline';
    console.log(error);
});

// Find out exactly when we made a connection.
ros.on('connection', function() {
    console.log('Connection made!');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('closed').style.display = 'none';
    document.getElementById('connected').style.display = 'inline';
});

ros.on('close', function() {
    console.log('Connection closed.');
    document.getElementById('connecting').style.display = 'none';
    document.getElementById('connected').style.display = 'none';
    document.getElementById('closed').style.display = 'inline';
});

// Create a connection to the rosbridge WebSocket server.
ros.connect('ws://localhost:9090');
// ros.connect('ws://192.168.56.101:9090');

// Publishing a Topic
// ------------------

// Create a Topic object with details of the topic's name and message type.
var cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : '/cmd_vel',
    messageType : 'geometry_msgs/Twist'
});

// Key binding.
var moveBindings = new Map([['u', [1, 1]],
    ['i', [1, 0]],
    ['o', [1, -1]],
    ['j', [0, 1]],
    ['k', [0, 0]],
    ['l', [0, -1]],
    ['m', [-1, -1]],
    [',', [-1, 0]],
    ['.', [-1, 1]]
]);

var speedBindings = new Map([['q', [1.1, 1.1]],
    ['z', [0.9, 0.9]],
    ['w', [1.1, 1]],
    ['x', [0.9, 1]],
    ['e', [1, 1.1]],
    ['c', [1, 0.9]]
]);

var speed = 0.2;
var turn = 1;

var x = 0;
var th = 0;
var status = 0;
var count = 0;
var acc = 0.1;
var target_speed = 0;
var target_turn = 0;
var control_speed = 0;
var control_turn = 0;
var intervalID;

var stop = new ROSLIB.Message({
    linear : {
        x : 0,
        y : 0,
        z : 0
    },
    angular : {
        x : 0,
        y : 0,
        z : 0
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Do function when clicking.
function MouseDown(clicked_id) {

    intervalID = setInterval(function(){PublishTwist(clicked_id);}, 500);
}

function PublishTwist(clicked_id) {

    if (moveBindings.has(clicked_id)){
        x = moveBindings.get(clicked_id)[0];
        th = moveBindings.get(clicked_id)[1];
        count = 0;
    } else if (speedBindings.has(clicked_id)){
        speed = speed * speedBindings.get(clicked_id)[0];
        turn = turn * speedBindings.get(clicked_id)[1];
        count = 0;
        status = (status + 1) % 15;
    } else if (clicked_id == "k"){
        x = 0;
        th = 0;
        control_speed = 0;
        control_turn = 0;
        speed = 0.2;
        turn = 1;
    } else {
        count = count + 1
        if (count > 4){
            x = 0;
            th = 0;
        }
    }
    target_speed = speed * x;
    target_turn = turn * th;

    if (target_speed > control_speed){
        control_speed = Math.min(target_speed, control_speed + 0.02);
    } else if (target_speed < control_speed){
        control_speed = Math.max( target_speed, control_speed - 0.02 );
    } else {
        control_speed = target_speed;
    }

    if (target_turn > control_turn){
        control_turn = Math.min( target_turn, control_turn + 0.1 );
    } else if (target_turn < control_turn){
        control_turn = Math.max( target_turn, control_turn - 0.1 );
    } else {
        control_turn = target_turn;
    }

    // Create the payload to be published. The object we pass in to ros.Message matches the
    // fields defined in the geometry_msgs/Twist.msg definition.
    var twist = new ROSLIB.Message({
        linear : {
            x : control_speed,
            y : 0,
            z : 0
        },
        angular : {
            x : 0,
            y : 0,
            z : control_turn
        }
    });
    cmdVel.publish(twist);
    // await sleep(100);
}

function MouseUp(){
    // alert('Mouse up event occurred.');
    clearInterval(intervalID);
    x = 0; th = 0;
    control_speed = 0;
    control_turn = 0;
    speed = 0.2;
    turn = 1;
    cmdVel.publish(stop);
}
