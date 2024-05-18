var canvas = new fabric.Canvas("canvas");
var state = [];
var mods = 0;

function saveState() {
  state = state.slice(0, state.length - mods);
  state.push(JSON.stringify(canvas));
  mods = 0;
}

function drawShape(shapeType) {
  var color = document.getElementById("colorPicker").value;

  canvas.off("mouse:down");

  canvas.on("mouse:down", function (options) {
    var pointer = canvas.getPointer(options.e);
    var x = pointer.x;
    var y = pointer.y;

    var shape;
    if (shapeType === "rectangle") {
      shape = new fabric.Rect({
        left: x,
        top: y,
        width: 100,
        height: 100,
        fill: color,
        selectable: true,
      });
    } else if (shapeType === "circle") {
      shape = new fabric.Circle({
        left: x,
        top: y,
        radius: 50,
        fill: color,
        selectable: true,
      });
    } else if (shapeType === "triangle") {
      shape = new fabric.Triangle({
        left: x,
        top: y,
        width: 100,
        height: 100,
        fill: color,
        selectable: true,
      });
    }

    if (shape) {
      canvas.add(shape);
      canvas.renderAll();
      canvas.off("mouse:down");
      saveState();
    }
  });
}

function undo() {
  if (mods < state.length - 1) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - mods - 1]);
    canvas.renderAll();
    mods += 1;
  }
}

function redo() {
  if (mods > 0) {
    canvas.clear();
    canvas.loadFromJSON(state[state.length - 1 - mods + 1]);
    canvas.renderAll();
    mods -= 1;
  }
}

function group() {
  var activeObjects = canvas.getActiveObjects();
  if (activeObjects.length > 1) {
    var group = new fabric.Group(activeObjects, { selectable: true });
    canvas.discardActiveObject();
    canvas.add(group);
  }
  saveState();
}

function changeColor() {
  var activeObject = canvas.getActiveObject();
  if (activeObject) {
    activeObject.set({
      fill: document.getElementById("colorPicker").value,
    });
    canvas.requestRenderAll();
    saveState();
  }
}

canvas.on("object:modified", function () {
  saveState();
});
