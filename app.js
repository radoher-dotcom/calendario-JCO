var firebaseConfig = {
   apiKey: "AIzaSyAps7t_AkEpd9hFBihJ-Kw5MlHcjN4DOFc",
  authDomain: "calendario-jco.firebaseapp.com",
  databaseURL: "https://calendario-jco-default-rtdb.firebaseio.com",
  projectId: "calendario-jco",
  storageBucket: "calendario-jco.firebasestorage.app",
  messagingSenderId: "6311216056",
  appId: "1:6311216056:web:9096c7d69a9125527d454d"
};

firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.database();
var currentUser = null;
var currentDate = new Date();
var events = {};
var students = {};
var attendance = {};
var participation = {};

auth.onAuthStateChanged(function(user) {
    if (user) {
        db.ref('users/' + user.uid).once('value').then(function(snapshot) {
            var data = snapshot.val();
            currentUser = {uid: user.uid, name: data.name, email: data.email, role: data.role};
            loadData();
        });
    } else {
        currentUser = null;
        showLoginScreen();
    }
});

function loadData() {
    db.ref('events').on('value', function(s) { events = s.val() || {}; if (currentUser) showCalendar(); });
    db.ref('users').on('value', function(s) {
        var users = s.val() || {}; students = {};
        for (var uid in users) if (users[uid].role === 'student') students[uid] = {id: uid, name: users[uid].name};
        if (currentUser) showCalendar();
    });
    db.ref('attendance').on('value', function(s) { attendance = s.val() || {}; if (currentUser) showCalendar(); });
    db.ref('participation').on('value', function(s) { participation = s.val() || {}; if (currentUser) showCalendar(); });
}

function showLoginScreen() {
    document.getElementById('app').innerHTML = '<div class="min-h-screen flex items-center justify-center p-4"><div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-gray-800 mb-2">Sistema de Calendario</h1><p class="text-gray-600">Gestión de clases y asistencias</p></div><div class="flex gap-2 mb-6"><button onclick="showTab(\'login\')" id="loginTab" class="flex-1 py-2 px-4 rounded-lg font-semibold bg-indigo-600 text-white">Iniciar Sesión</button><button onclick="showTab(\'register\')" id="registerTab" class="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700">Registrarse</button></div><div id="loginForm"><div class="space-y-4"><input type="email" id="loginEmail" placeholder="Email" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><input type="password" id="loginPassword" placeholder="Contraseña" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><button onclick="login()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition">Entrar</button></div></div><div id="registerForm" class="hidden"><div class="space-y-4"><input type="text" id="registerName" placeholder="Nombre completo" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><input type="email" id="registerEmail" placeholder="Email" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><input type="password" id="registerPassword" placeholder="Contraseña (mínimo 6 caracteres)" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><select id="registerRole" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"><option value="">Selecciona tu rol</option><option value="admin">Administrador/Profesor</option><option value="student">Alumno</option></select><button onclick="register()" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition">Crear Cuenta</button></div></div><div id="authMessage" class="mt-4 text-center text-sm"></div></div></div>';
}

function showTab(tab) {
    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-indigo-600 text-white';
        document.getElementById('registerTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700';
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-700';
        document.getElementById('registerTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-indigo-600 text-white';
    }
}

function login() {
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password).catch(function(error) {
        showMessage('Error: ' + error.message, 'error');
    });
}

function register() {
    var name = document.getElementById('registerName').value;
    var email = document.getElementById('registerEmail').value;
    var password = document.getElementById('registerPassword').value;
    var role = document.getElementById('registerRole').value;
    if (!name || !email || !password || !role) { showMessage('Completa todos los campos', 'error'); return; }
    auth.createUserWithEmailAndPassword(email, password).then(function(u) {
        return db.ref('users/' + u.user.uid).set({name: name, email: email, role: role, createdAt: Date.now()});
    }).then(function() { showMessage('Cuenta creada', 'success'); }).catch(function(e) { showMessage('Error: ' + e.message, 'error'); });
}

function showMessage(msg, type) {
    var div = document.getElementById('authMessage');
    if (div) { div.textContent = msg; div.className = 'mt-4 text-center text-sm ' + (type === 'error' ? 'text-red-600' : 'text-green-600'); }
}

function logout() { auth.signOut(); }

function getEventColor(type) {
    return {clase:'bg-blue-200 text-blue-800', reunion:'bg-purple-200 text-purple-800', examen:'bg-green-200 text-green-800', evento:'bg-yellow-200 text-yellow-800'}[type] || 'bg-gray-200 text-gray-800';
}

function getBorderColor(type) {
    return {clase:'border-blue-500', reunion:'border-purple-500', examen:'border-green-500', evento:'border-yellow-500'}[type] || 'border-gray-500';
}

function changeMonth(delta) { currentDate.setMonth(currentDate.getMonth() + delta); showCalendar(); }

function formatDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function formatDateReadable(dateStr) {
    var months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var parts = dateStr.split('-');
    return parts[2] + ' de ' + months[parseInt(parts[1]) - 1] + ' de ' + parts[0];
}

function showCalendar() {
    var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var startDay = new Date(year, month, 1).getDay();
    var cal = '';
    for (var i = 0; i < startDay; i++) cal += '<div class="calendar-day"></div>';
    for (var day = 1; day <= daysInMonth; day++) {
        var dateStr = formatDate(new Date(year, month, day));
        var dayEvs = [];
        for (var id in events) if (events[id].date === dateStr) dayEvs.push(events[id]);
        var isToday = dateStr === formatDate(new Date());
        cal += '<div class="calendar-day border-2 ' + (isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200') + ' rounded-lg p-2 cursor-pointer hover:border-indigo-300" onclick="selectDate(\'' + dateStr + '\')"><div class="font-semibold text-gray-700 mb-1">' + day + '</div><div class="space-y-1">';
        for (var j = 0; j < dayEvs.length; j++) cal += '<div class="text-xs px-2 py-1 rounded truncate ' + getEventColor(dayEvs[j].type) + '">' + dayEvs[j].title + '</div>';
        cal += '</div></div>';
    }
    var isAdmin = currentUser.role === 'admin';
    var stuCnt = 0, stuHTML = '';
    for (var uid in students) {
        stuCnt++;
        var stats = getStudentStats(uid);
        stuHTML += '<div class="p-3 bg-gray-50 rounded-lg"><div class="font-semibold text-gray-800">' + students[uid].name + '</div><div class="text-xs text-gray-600 mt-1 flex gap-3"><span>✓ ' + stats.attendance + '</span><span>⭐ ' + stats.participation + '</span></div></div>';
    }
    var html = '<div class="max-w-7xl mx-auto p-4"><div class="bg-white rounded-xl shadow-lg p-6 mb-6"><div class="flex justify-between items-center flex-wrap gap-4"><div><h1 class="text-3xl font-bold text-gray-800">Calendario de Actividades</h1><p class="text-gray-600 mt-1"><span class="font-semibold">' + currentUser.name + '</span><span class="ml-2 text-sm ' + (isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700') + ' px-3 py-1 rounded-full">' + (isAdmin ? 'Administrador' : 'Alumno') + '</span></p></div><button onclick="logout()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg">Salir</button></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2"><div class="bg-white rounded-xl shadow-lg p-6"><div class="flex justify-between items-center mb-6"><button onclick="changeMonth(-1)" class="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg font-semibold">←</button><h2 class="text-2xl font-bold text-gray-800">' + monthNames[month] + ' ' + year + '</h2><button onclick="changeMonth(1)" class="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg font-semibold">→</button></div><div class="grid grid-cols-7 gap-2 mb-2">';
    for (var i = 0; i < 7; i++) html += '<div class="text-center font-semibold text-gray-600 py-2">' + dayNames[i] + '</div>';
    html += '</div><div class="grid grid-cols-7 gap-2">' + cal + '</div></div></div><div class="space-y-6"><div id="sidePanel" class="bg-white rounded-xl shadow-lg p-6"><h3 class="text-xl font-bold text-gray-800 mb-4">Información</h3><p class="text-gray-600">Selecciona un día</p></div>';
    if (isAdmin) html += '<div class="bg-white rounded-xl shadow-lg p-6"><h3 class="text-xl font-bold text-gray-800 mb-4">Alumnos (' + stuCnt + ')</h3><div class="space-y-2 max-h-64 overflow-y-auto">' + stuHTML + '</div></div>';
    else html += '<div class="bg-white rounded-xl shadow-lg p-6"><h3 class="text-xl font-bold text-gray-800 mb-4">Mis Estadísticas</h3><div>' + getMyStatsHTML() + '</div></div>';
    html += '</div></div></div><div id="modals"></div>';
    document.getElementById('app').innerHTML = html;
}

function selectDate(dateStr) {
    var dayEvs = [];
    for (var id in events) if (events[id].date === dateStr) dayEvs.push(events[id]);
    var isAdmin = currentUser.role === 'admin';
    var html = '<h3 class="text-xl font-bold text-gray-800 mb-4">' + formatDateReadable(dateStr) + '</h3>';
    if (dayEvs.length === 0) html += '<p class="text-gray-600 mb-4">No hay eventos</p>';
    else {
        for (var i = 0; i < dayEvs.length; i++) {
            var ev = dayEvs[i];
            html += '<div class="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 ' + getBorderColor(ev.type) + '"><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-gray-800 text-lg">' + ev.title + '</h4>';
            if (isAdmin) html += '<button onclick="deleteEvent(\'' + ev.id + '\')" class="text-red-500 hover:text-red-700">🗑️</button>';
            html += '</div><p class="text-sm text-gray-600 mb-1">⏰ ' + (ev.time || 'Sin hora') + '</p>';
            if (ev.cost) html += '<p class="text-sm text-gray-600 mb-1">💰 $' + ev.cost + '</p>';
            if (ev.description) html += '<p class="text-sm text-gray-600 mt-2">' + ev.description + '</p>';
            if (isAdmin) html += '<button onclick="showAttendanceModal(\'' + ev.id + '\')" class="mt-3 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">📋 Pasar Lista</button>';
            html += '</div>';
        }
    }
    if (isAdmin) html += '<button onclick="showAddEventModal(\'' + dateStr + '\')" class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">➕ Agregar Evento</button>';
    document.getElementById('sidePanel').innerHTML = html;
}

function showAddEventModal(dateStr) {
    document.getElementById('modals').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-white rounded-xl p-6 max-w-md w-full" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold">Agregar Evento</h3><button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button></div><div class="space-y-4"><input type="text" id="eventTitle" placeholder="Título" class="w-full px-4 py-2 border rounded-lg"><select id="eventType" class="w-full px-4 py-2 border rounded-lg"><option value="clase">Clase</option><option value="reunion">Reunión</option><option value="examen">Examen</option><option value="evento">Evento</option></select><input type="time" id="eventTime" class="w-full px-4 py-2 border rounded-lg"><input type="number" id="eventCost" placeholder="Costo" class="w-full px-4 py-2 border rounded-lg"><textarea id="eventDescription" placeholder="Descripción" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea><button onclick="addEvent(\'' + dateStr + '\')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold">Guardar</button></div></div></div>';
}

function addEvent(dateStr) {
    var title = document.getElementById('eventTitle').value;
    if (!title) { alert('Ingresa un título'); return; }
    var eventId = Date.now().toString();
    db.ref('events/' + eventId).set({id: eventId, title: title, type: document.getElementById('eventType').value, time: document.getElementById('eventTime').value, cost: document.getElementById('eventCost').value, description: document.getElementById('eventDescription').value, date: dateStr, createdBy: currentUser.uid, createdAt: Date.now()});
    closeModal();
    selectDate(dateStr);
}

function deleteEvent(eventId) { if (confirm('¿Eliminar?')) db.ref('events/' + eventId).remove(); }

function showAttendanceModal(eventId) {
    var ev = events[eventId];
    var html = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><div><h3 class="text-xl font-bold">Pasar Lista</h3><p class="text-sm text-gray-600">' + ev.title + '</p></div><button onclick="closeModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button></div><div class="space-y-2">';
    for (var uid in students) {
        var stu = students[uid];
        var attKey = eventId + '-' + uid;
        var isPresent = attendance[attKey] || false;
        html += '<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><span class="font-medium">' + stu.name + '</span><div class="flex gap-2"><button onclick="toggleAttendance(\'' + eventId + '\',\'' + uid + '\')" class="px-4 py-1 rounded ' + (isPresent ? 'bg-green-500 text-white' : 'bg-gray-300') + '">' + (isPresent ? '✓ Presente' : 'Ausente') + '</button><button onclick="addParticipation(\'' + uid + '\')" class="px-3 py-1 bg-yellow-500 text-white rounded">+1 ⭐</button></div></div>';
    }
    html += '</div></div></div>';
    document.getElementById('modals').innerHTML = html;
}

function toggleAttendance(eventId, studentId) {
    var key = eventId + '-' + studentId;
    db.ref('attendance/' + key).set(!(attendance[key] || false));
}

function addParticipation(studentId) {
    var pid = Date.now().toString();
    db.ref('participation/' + pid).set({studentId: studentId, points: 1, date: formatDate(new Date()), timestamp: Date.now()});
}

function getStudentStats(studentId) {
    var attCnt = 0, partPts = 0;
    for (var key in attendance) if (key.indexOf(studentId) !== -1 && attendance[key]) attCnt++;
    for (var id in participation) if (participation[id].studentId === studentId) partPts += participation[id].points || 0;
    return {attendance: attCnt, participation: partPts};
}

function getMyStatsHTML() {
    var stats = getStudentStats(currentUser.uid);
    return '<div class="space-y-3"><div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg"><span>✓ Asistencias</span><span class="font-bold text-blue-600">' + stats.attendance + '</span></div><div class="flex items-center justify-between p-3 bg-green-50 rounded-lg"><span>⭐ Participaciones</span><span class="font-bold text-green-600">' + stats.participation + '</span></div></div>';
}

function closeModal(event) { if (!event || event.target === event.currentTarget) document.getElementById('modals').innerHTML = ''; }

showLoginScreen();
