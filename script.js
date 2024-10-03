const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const resultDiv = document.getElementById('result');
const newIdeaInput = document.getElementById('newIdeaInput');
const addIdeaButton = document.getElementById('addIdeaButton');
const deleteIdeaSelect = document.getElementById('deleteIdeaSelect');
const deleteIdeaButton = document.getElementById('deleteIdeaButton');

const apiURL = 'http://localhost:5000/dateIdeas';  // JSON Server URL

let dateIdeas = [];

// Fetch date ideas from the server and initialize the wheel
fetch(apiURL)
    .then(response => response.json())
    .then(data => {
        dateIdeas = data;
        drawWheel();
        populateDeleteDropdown();
    })
    .catch(error => console.error('Error fetching date ideas:', error));

// Function to draw the wheel
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = centerX - 10;
    const numOfSegments = dateIdeas.length;
    const anglePerSegment = (2 * Math.PI) / numOfSegments;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < numOfSegments; i++) {
        const startAngle = i * anglePerSegment;
        const endAngle = (i + 1) * anglePerSegment;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.fillStyle = i % 2 === 0 ? '#FFDDC1' : '#FFABAB';  // Alternate colors
        ctx.fill();
        ctx.stroke();

        // Add text to each segment
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText(dateIdeas[i].idea, outerRadius - 10, 5);
        ctx.restore();
    }
}

// Function to handle spinning the wheel
let spinAngle = 0;
let isSpinning = false;

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;

    let spinVelocity = Math.random() * 0.2 + 0.3; // Initial velocity

    function animateSpin() {
        spinAngle += spinVelocity;
        spinVelocity *= 0.97;  // Slow down over time

        if (spinVelocity < 0.001) {
            isSpinning = false;
            spinButton.disabled = false;
            showResult();
            return;
        }

        drawRotatedWheel(spinAngle);
        requestAnimationFrame(animateSpin);
    }

    animateSpin();
}

function drawRotatedWheel(angle) {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheel();
    ctx.restore();
}

// Function to show result
function showResult() {
    const numOfSegments = dateIdeas.length;
    const anglePerSegment = (2 * Math.PI) / numOfSegments;
    const resultIndex = Math.floor(numOfSegments - ((spinAngle % (2 * Math.PI)) / anglePerSegment)) % numOfSegments;
    resultDiv.innerText = `Your date idea: ${dateIdeas[resultIndex].idea}!`;
}

// Add event listener to button
spinButton.addEventListener('click', spinWheel);

// Function to add a new date idea
addIdeaButton.addEventListener('click', () => {
    const newIdea = newIdeaInput.value.trim();
    if (newIdea) {
        fetch(apiURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea: newIdea })
        })
        .then(response => response.json())
        .then(data => {
            dateIdeas.push(data.idea);
            drawWheel();
            populateDeleteDropdown();
            newIdeaInput.value = '';
        })
        .catch(error => console.error('Error adding date idea:', error));
    }
});

// Function to populate the delete dropdown
function populateDeleteDropdown() {
    deleteIdeaSelect.innerHTML = '';
    dateIdeas.forEach((ideOption, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = ideOption.idea;
        deleteIdeaSelect.add(option);
    });
}

// Function to delete a date idea
deleteIdeaButton.addEventListener('click', () => {
    const selectedIndex = deleteIdeaSelect.value;
    if (selectedIndex !== '') {
        const ideaToDelete = dateIdeas[selectedIndex];

        fetch(`${apiURL}/${ideaToDelete.id}`, { method: 'DELETE' })
            .then(() => {
                dateIdeas.splice(selectedIndex, 1);
                drawWheel();
                populateDeleteDropdown();
            })
            .catch(error => console.error('Error deleting date idea:', error));
    }
});
