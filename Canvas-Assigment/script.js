const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let shapes = [];
let undoStack = [];
let redoStack = [];
let currentAction = null;
let selectedShape = null;
let isDragging = false;
let isResizing = false;
let resizeHandle = null;
let startX, startY;
let fillColor = '#000000';

document.getElementById('draw-rectangle').addEventListener('click', () => startDrawing('rectangle'));
document.getElementById('draw-circle').addEventListener('click', () => startDrawing('circle'));
document.getElementById('draw-triangle').addEventListener('click', () => startDrawing('triangle'));
document.getElementById('fill-color').addEventListener('change', (e) => fillColor = e.target.value);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('group').addEventListener('click', groupShapes);

canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseup', onMouseUp);

function startDrawing(shape) {
    currentAction = shape;
}

function onMouseDown(e) {
    startX = e.offsetX;
    startY = e.offsetY;

    if (currentAction) {
        const shape = createShape(currentAction, startX, startY, fillColor);
        shapes.push(shape);
        undoStack.push([...shapes]);
        redoStack = [];
        currentAction = null;
    } else {
        selectedShape = getShapeAt(startX, startY);
        if (selectedShape) {
            isDragging = true;
            resizeHandle = getResizeHandle(selectedShape, startX, startY);
            if (resizeHandle) {
                isResizing = true;
            }
        }
    }

    redrawCanvas();
}

function onMouseMove(e) {
    if (isDragging && selectedShape && !isResizing) {
        const dx = e.offsetX - startX;
        const dy = e.offsetY - startY;
        selectedShape.x += dx;
        selectedShape.y += dy;
        startX = e.offsetX;
        startY = e.offsetY;
        redrawCanvas();
    } else if (isResizing && selectedShape) {
        const dx = e.offsetX - startX;
        const dy = e.offsetY - startY;
        resizeShape(selectedShape, resizeHandle, dx, dy);
        startX = e.offsetX;
        startY = e.offsetY;
        redrawCanvas();
    }
}

function onMouseUp() {
    isDragging = false;
    isResizing = false;
    selectedShape = null;
    resizeHandle = null;
}

function createShape(type, x, y, color) {
    switch (type) {
        case 'rectangle':
            return { type, x, y, width: 100, height: 50, color, handles: getHandles(x, y, 100, 50) };
        case 'circle':
            return { type, x, y, radius: 50, color, handles: getHandles(x - 50, y - 50, 100, 100) };
        case 'triangle':
            return { type, x, y, size: 50, color, handles: getHandles(x, y - 50, 50, 50) };
    }
}

function getHandles(x, y, width, height) {
    return [
        { x, y }, // top-left
        { x: x + width, y }, // top-right
        { x, y: y + height }, // bottom-left
        { x: x + width, y: y + height } // bottom-right
    ];
}

function getShapeAt(x, y) {
    return shapes.find(shape => {
        switch (shape.type) {
            case 'rectangle':
                return x > shape.x && x < shape.x + shape.width && y > shape.y && y < shape.y + shape.height;
            case 'circle':
                const dx = x - shape.x;
                const dy = y - shape.y;
                return dx * dx + dy * dy < shape.radius * shape.radius;
            case 'triangle':
                const base = shape.size;
                const height = shape.size;
                const triArea = 0.5 * base * height;
                const pArea1 = Math.abs((shape.x - x) * (shape.y - (shape.y - height)) - (shape.x - base - x) * (shape.y - y)) / 2;
                const pArea2 = Math.abs((shape.x - x) * (shape.y - height - y) - (shape.x - (shape.x + base / 2) - x) * (shape.y - y)) / 2;
                const pArea3 = Math.abs((shape.x + base / 2 - x) * (shape.y - height - y) - (shape.x - base / 2 - x) * (shape.y - y)) / 2;
                return triArea === (pArea1 + pArea2 + pArea3);
        }
    });
}

function getResizeHandle(shape, x, y) {
    return shape.handles.find(handle => {
        return Math.abs(x - handle.x) < 5 && Math.abs(y - handle.y) < 5;
    });
}

function resizeShape(shape, handle, dx, dy) {
    switch (shape.type) {
        case 'rectangle':
            if (handle === shape.handles[0]) { // top-left
                shape.x += dx;
                shape.y += dy;
                shape.width -= dx;
                shape.height -= dy;
            } else if (handle === shape.handles[1]) { // top-right
                shape.y += dy;
                shape.width += dx;
                shape.height -= dy;
            } else if (handle === shape.handles[2]) { // bottom-left
                shape.x += dx;
                shape.width -= dx;
                shape.height += dy;
            } else if (handle === shape.handles[3]) { // bottom-right
                shape.width += dx;
                shape.height += dy;
            }
            shape.handles = getHandles(shape.x, shape.y, shape.width, shape.height);
            break;
        case 'circle':
            if (handle === shape.handles[0] || handle === shape.handles[1] ||
                handle === shape.handles[2] || handle === shape.handles[3]) {
                const newRadius = Math.sqrt(dx * dx + dy * dy);
                shape.radius = newRadius;
                shape.handles = getHandles(shape.x - shape.radius, shape.y - shape.radius, shape.radius * 2, shape.radius * 2);
            }
            break;
        case 'triangle':
            if (handle === shape.handles[0]) { // top-left
                shape.x += dx;
                shape.size -= dx;
                shape.y -= dy;
            } else if (handle === shape.handles[1]) { // top-right
                shape.size += dx;
                shape.y -= dy;
            } else if (handle === shape.handles[2]) { // bottom-left
                shape.x += dx;
                shape.size -= dx;
            } else if (handle === shape.handles[3]) { // bottom-right
                shape.size += dx;
            }
            shape.handles = getHandles(shape.x, shape.y - shape.size, shape.size, shape.size);
            break;
    }
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => {
        ctx.fillStyle = shape.color;
        switch (shape.type) {
            case 'rectangle':
                ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
                drawHandles(shape.handles);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                ctx.fill();
                drawHandles(shape.handles);
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x + shape.size, shape.y);
                ctx.lineTo(shape.x + shape.size / 2, shape.y - shape.size);
                ctx.closePath();
                ctx.fill();
                drawHandles(shape.handles);
                break;
        }
    });
}

function drawHandles(handles) {
    ctx.fillStyle = 'blue';
    handles.forEach(handle => {
        ctx.fillRect(handle.x - 3, handle.y - 3, 6, 6);
    });
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(shapes);
        shapes = undoStack.pop();
        redrawCanvas();
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(shapes);
        shapes = redoStack.pop();
        redrawCanvas();
    }
}

function groupShapes() {
    // Implement grouping functionality
}
