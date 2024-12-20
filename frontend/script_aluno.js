let editingPostIt = null;
let selectedColor = 'yellow';
let currentRoom = 'Sala1';

document.addEventListener('DOMContentLoaded', async () => {
    await loadRooms();
    await loadPostIts();
});

async function loadRooms() {
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '';

    try {
        const response = await fetch('http://localhost:3001/api/rooms');
        const rooms = await response.json();

        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            roomSelect.appendChild(option);
        });

        currentRoom = localStorage.getItem('currentRoom') || rooms[0] || 'Sala1';
        roomSelect.value = currentRoom;
        localStorage.setItem('currentRoom', currentRoom);
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
    }
}

async function loadPostIts() {
    try {
        const response = await fetch(`http://localhost:3001/api/postIts?room=${currentRoom}`);
        const postIts = await response.json();

        document.getElementById('postItContainer').innerHTML = '';
        postIts.forEach(data => {
            const postIt = createPostItElement(data.id, data);
            document.getElementById('postItContainer').appendChild(postIt);
        });
    } catch (error) {
        console.error('Erro ao carregar Post-Its:', error);
    }
}

function openEditModal(postIt = null) {
    editingPostIt = postIt;

    if (postIt) {
        document.getElementById('nameInput').value = postIt.dataset.name;
        document.getElementById('classInput').value = postIt.dataset.class;
        document.getElementById('shiftInput').value = postIt.dataset.shift;
        document.getElementById('textContent').value = postIt.dataset.content;
        selectedColor = postIt.style.backgroundColor;
    } else {
        document.getElementById('nameInput').value = '';
        document.getElementById('classInput').value = '';
        document.getElementById('shiftInput').value = '';
        document.getElementById('textContent').value = '';
        selectedColor = 'yellow';
    }

    document.getElementById('editModal').style.display = 'block';
    updateColorSelection();
}

function closeEditModal() {
    editingPostIt = null;
    document.getElementById('editModal').style.display = 'none';
}

async function savePostIt() {
    const name = document.getElementById('nameInput').value;
    const className = document.getElementById('classInput').value;
    const shift = document.getElementById('shiftInput').value;
    const content = document.getElementById('textContent').value;

    const postItData = {
        name,
        class: className,
        shift,
        content,
        color: selectedColor,
        room: currentRoom
    };

    try {
        if (editingPostIt) {
            // Edição de um Post-It existente
            const postId = editingPostIt.dataset.id; // Pega o ID do post-it a ser editado
            const response = await fetch(`http://localhost:3001/api/postIts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postItData)
            });

            if (response.ok) {
                // Atualiza visualmente o post-it na página
                editingPostIt.dataset.name = name;
                editingPostIt.dataset.class = className;
                editingPostIt.dataset.shift = shift;
                editingPostIt.dataset.content = content;
                editingPostIt.style.backgroundColor = selectedColor;
                editingPostIt.querySelector('p').textContent = content;
            } else {
                console.error('Erro ao editar Post-It:', await response.text());
            }
        } else {
            // Criação de um novo Post-It
            const response = await fetch('http://localhost:3001/api/postIts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postItData)
            });

            if (response.ok) {
                const newPostIt = await response.json();
                const postItElement = createPostItElement(newPostIt.id, postItData);
                document.getElementById('postItContainer').appendChild(postItElement);
            } else {
                console.error('Erro ao salvar Post-It:', response.statusText);
            }
        }
    } catch (error) {
        console.error('Erro:', error);
    }

    closeEditModal();
}

function createPostItElement(id, data) {
    const postIt = document.createElement('div');
    postIt.className = 'post-it';
    postIt.dataset.id = id;
    postIt.dataset.name = data.name;
    postIt.dataset.class = data.class;
    postIt.dataset.shift = data.shift;
    postIt.dataset.content = data.content;
    postIt.style.backgroundColor = data.color;
    
    postIt.innerHTML = `
        <p>${data.content}</p>
        <div class="student-name">${data.name}</div>
    `;
    postIt.onclick = () => openEditModal(postIt);
    return postIt;
}


function selectColor(color) {
    selectedColor = color;
    updateColorSelection();
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.style.backgroundColor === selectedColor);
    });
}

async function addRoom() {
    const newRoom = prompt('Digite o nome da nova sala:');
    if (!newRoom) return;

    try {
        await fetch('http://localhost:3001/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: newRoom })
        });
        await loadRooms();
        changeRoom(newRoom);
    } catch (error) {
        console.error('Erro ao adicionar sala:', error);
    }
}

function changeRoom() {
    currentRoom = document.getElementById('roomSelect').value;
    localStorage.setItem('currentRoom', currentRoom);
    loadPostIts();
}

function confirmCloseModal() {
    if (confirm("Deseja salvar as alterações antes de sair?")) {
        savePostIt();
    } else {
        closeEditModal();
    }
}
