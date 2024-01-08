class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	static add(a, b) {
		return new Vector(a.x + b.x, a.y + b.y);
	}
	static sub(a, b) {
		return new Vector(a.x - b.x, a.y - b.y);
	}
	static mul(a, b) {
		return new Vector(a.x * b.x, a.y * b.y);
	}
	static div(a, b) {
		return new Vector(a.x / b.x, a.y / b.y);
	}
	static lt(a, b) {
		return a.x < b.x || a.y < b.y;
	}
	static gt(a, b) {
		return a.x > b.x || a.y > b.y;
	}
	static eq(a, b) {
		return a.x == b.x && a.y == b.y;
	}
	static floor(a) {
		return new Vector(Math.floor(a.x), Math.floor(a.y));
	}
}

class Pebble {
	constructor(n, xy) {
		this.n = n;
		this.xy = xy;
	}
	get color() {
		return this.n === 1 ? '#C48868' : '#CCCCCC';
	}
}

function setCursor(cursor) {
	document.documentElement.style.cursor = cursor;
	currentCursor = cursor;
}

let
	pebbles, pebbleN,
	size, cellScale,
	font,
	isPanning, pan,
	isMouseDown, prevMouseXy, originMouseXy,
	currentCursor;

function init() {
	pebbles = [
		new Pebble(1, new Vector(0, 0)),
		new Pebble(1, new Vector(2, 2))
	];

	pebbleN = 2;

	size = new Vector(document.documentElement.clientWidth, document.documentElement.clientHeight);
	cellScale = Vector.mul(new Vector(48, 48), new Vector(devicePixelRatio, devicePixelRatio));

	font = `"Charis SIL", "Latin Modern Roman", "CMU Serif", P052, "Palatino Linotype", Palatino, Georgia, "Times New Roman", Times, serif`;

	isPanning = false;
	pan = new Vector(size.x / 2, size.y / 2);

	isMouseDown = false;

	prevMouseXy = null;
	originMouseXy = null;

	currentCursor;
	setCursor('pointer');
	
	draw();
}

function drawPebble(pebble, faint) {
	let drawXy = Vector.add(
		Vector.mul(
			Vector.add(pebble.xy, new Vector(.5, .5)),
			cellScale
		),
		pan
	);
	let radius = Math.floor(cellScale.x * .4);
	if (
		drawXy.x + radius < 0 || drawXy.x - radius > size.x ||
		drawXy.y + radius < 0 || drawXy.y - radius > size.y
	)
		return;

	ctx.strokeStyle = pebble.color + (faint ? '88' : 'ff');
	ctx.lineWidth = Math.floor(cellScale.x / 16);
	ctx.beginPath();
	ctx.arc(
		drawXy.x, drawXy.y,
		radius,
		0, 2 * Math.PI
	);
	ctx.stroke();
	
	ctx.fillStyle = faint ? '#888888' : 'black';
	ctx.font = `${cellScale.x / 2}px ${font}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(pebble.n, drawXy.x, drawXy.y, cellScale.x * .75)
}

function draw(pebbleXy) {
	size = new Vector(document.documentElement.clientWidth, document.documentElement.clientHeight);
	canvas.width = size.x;
	canvas.height = size.y;
	ctx.lineWidth = Math.floor(cellScale.x / 32);

	for (let x = pan.x % cellScale.x - cellScale.x - 1; x < size.x; x += cellScale.x) {
		for (let y = pan.y % cellScale.y - cellScale.x - 1; y < size.y; y += cellScale.y) {
			ctx.strokeStyle = '#CCCCCC';
			ctx.strokeRect(x, y, cellScale.x, cellScale.y);
		}
	}

	for (let pebble of pebbles)
		drawPebble(pebble);
	
	ctx.fillStyle = 'black';
	ctx.font = `${60 * devicePixelRatio}px ${font}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillText(pebbleN, size.x / 2, 10 * devicePixelRatio);
}

function mouseDown(e) {
	isMouseDown = true;
	let mouseXy = new Vector(e.clientX, e.clientY);
	originMouseXy = mouseXy;
}

function mouseDrag(e) {
	let mouseXy = new Vector(e.clientX, e.clientY);
	
	// don't pan on every mouse drag
	let mouseDelta = Vector.sub(mouseXy, originMouseXy);
	if (
		-15 < mouseDelta.x && mouseDelta.x < 15 &&
		-15 < mouseDelta.y && mouseDelta.y < 15
	) {
		setCursor('pointer');
		return;
	};

	pan = Vector.add(pan, Vector.sub(mouseXy, prevMouseXy || mouseXy));
	isPanning = true;
	setCursor('grab');
	draw();

	prevMouseXy = mouseXy;
}

function mouseMove(e) {
	if (isMouseDown) {
		mouseDrag(e);
		return;
	}
}

function mouseUp(e) {
	isMouseDown = false;
	
	if (isPanning) {1
		isPanning = false;
		setCursor('pointer');
		prevMouseXy = null;
		return;
	}
	
	let mouseXy = new Vector(e.clientX, e.clientY);
	let pebble = new Pebble(
		pebbleN,
		Vector.floor(Vector.div(Vector.sub(mouseXy, pan), cellScale))
	);

	if (pebbles.find(p => Vector.eq(p.xy, pebble.xy))) return;
	
	let total = 0;
	for (let cx = pebble.xy.x - 1; cx <= pebble.xy.x + 1; cx += 1) {
		for (let cy = pebble.xy.y - 1; cy <= pebble.xy.y + 1; cy += 1) {
			let check = new Vector(cx, cy);
			
			if (Vector.eq(check, pebble.xy)) continue;
			
			let checkPebble =
				pebbles.find(p => Vector.eq(p.xy, check)) ||
				new Pebble(0, check);

			total += checkPebble.n;
		}
	}
	if (total !== pebbleN)
		return;
	
	pebbles.push(pebble);
	
	pebbleN++;
	draw();
}

function undo() {
	if (!pebbles.find(p => p.n > 1)) return;

	pebbles.pop();
	pebbleN--;
	draw();
}

function zoomOut() {
	cellScale = Vector.sub(cellScale, new Vector(16, 16));
	draw();
}
function zoomIn() {
	cellScale = Vector.add(cellScale, new Vector(16, 16));
	draw();
}

function clear() {
	let opacity = 1;
	let intFade = setInterval(() => {
		opacity -= 0.05;
		if (opacity <= 0) {
			clearInterval(intFade);
			
			init();
			opacity = 0;
			let intBloom = setInterval(() => {
				opacity += 0.05;
				if (opacity >= 1) clearInterval(intBloom);
				canvas.style.opacity = opacity;
			}, 1000 / 60);
		}
		canvas.style.opacity = opacity;
	}, 1000 / 60);
}

function keyDown(e) {
	if (e.code === 'KeyZ') undo();
	if (e.code === 'KeyX') zoomOut();
	if (e.code === 'KeyC') zoomIn();
	if (e.code === 'KeyV') clear();
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
init();
setInterval(draw, 500);

canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('mouseup', mouseUp);
document.addEventListener('keydown', keyDown);

// touchscreen compatibility glue

let lastTouch = null;

canvas.addEventListener('touchstart', e => {
	lastTouch = e.touches[0];
	mouseDown({
		clientX: e.touches[0].clientX,
		clientY: e.touches[0].clientY,
		touch: true
	})
});
canvas.addEventListener('touchmove', e => {
	e.preventDefault();
	lastTouch = e.touches[0];
	mouseMove({
		clientX: e.touches[0].clientX,
		clientY: e.touches[0].clientY,
		touch: true
	})
});
canvas.addEventListener('touchend', e => {
	if (!lastTouch) return;
	mouseUp({
		clientX: lastTouch.clientX,
		clientY: lastTouch.clientY,
		touch: true
	})
});

for (id of ['undo', 'zoomIn', 'zoomOut', 'clear']) {
	document.getElementById(id).addEventListener('click', this[id]);
	document.getElementById(id).addEventListener('touchstart', this[id]);
}
