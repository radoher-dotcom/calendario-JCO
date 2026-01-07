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
var allUsers = {};
var attendance = {};
var participation = {};
var attendanceChart = null;
var participationChart = null;

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
        var users = s.val() || {};
        students = {};
        allUsers = users;
        for (var uid in users) {
            if (users[uid].role === 'student') students[uid] = {id: uid, name: users[uid].name, email: users[uid].email};
        }
        if (currentUser) showCalendar();
    });
    db.ref('attendance').on('value', function(s) { attendance = s.val() || {}; if (currentUser) showCalendar(); });
    db.ref('participation').on('value', function(s) { participation = s.val() || {}; if (currentUser) showCalendar(); });
}

function getUpcomingEvents() {
    var today = formatDate(new Date());
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr = formatDate(tomorrow);
    
    var weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    var weekEndStr = formatDate(weekEnd);
    
    var eventsToday = [];
    var eventsTomorrow = [];
    var eventsThisWeek = [];
    
    for (var id in events) {
        var ev = events[id];
        if (ev.date === today) eventsToday.push(ev);
        else if (ev.date === tomorrowStr) eventsTomorrow.push(ev);
        else if (ev.date > today && ev.date <= weekEndStr) eventsThisWeek.push(ev);
    }
    
    return {today: eventsToday, tomorrow: eventsTomorrow, week: eventsThisWeek};
}

function showReminderBanner() {
    var upcoming = getUpcomingEvents();
    var banners = '';
    
    if (upcoming.today.length > 0) {
        banners += '<div class="bg-gradient-to-r from-red-900 to-red-700 border-2 border-red-500 rounded-lg p-4 mb-4 glow-gold"><div class="flex items-center gap-3"><span class="text-3xl">🔥</span><div class="flex-1"><div class="font-bold text-white text-lg">¡EVENTOS HOY!</div><div class="text-red-200 text-sm">Tienes ' + upcoming.today.length + ' evento(s) programado(s) para hoy</div></div><button onclick="showTodayEvents()" class="btn-gold px-4 py-2 rounded-lg text-sm">VER</button></div></div>';
    }
    
    if (upcoming.tomorrow.length > 0) {
        banners += '<div class="bg-gradient-to-r from-orange-900 to-orange-700 border-2 border-orange-500 rounded-lg p-4 mb-4"><div class="flex items-center gap-3"><span class="text-3xl">⚡</span><div class="flex-1"><div class="font-bold text-white text-lg">Eventos Mañana</div><div class="text-orange-200 text-sm">Tienes ' + upcoming.tomorrow.length + ' evento(s) programado(s) para mañana</div></div><button onclick="showTomorrowEvents()" class="btn-gold px-4 py-2 rounded-lg text-sm">VER</button></div></div>';
    }
    
    if (upcoming.week.length > 0) {
        banners += '<div class="bg-gradient-to-r from-blue-900 to-blue-700 border-2 border-blue-500 rounded-lg p-4 mb-4"><div class="flex items-center gap-3"><span class="text-3xl">📅</span><div class="flex-1"><div class="font-bold text-white text-lg">Próximos 7 Días</div><div class="text-blue-200 text-sm">Tienes ' + upcoming.week.length + ' evento(s) esta semana</div></div><button onclick="showWeekEvents()" class="btn-gold px-4 py-2 rounded-lg text-sm">VER</button></div></div>';
    }
    
    if (!banners) {
        banners = '<div class="bg-gradient-to-r from-green-900 to-green-700 border-2 border-green-500 rounded-lg p-4 mb-4"><div class="flex items-center gap-3"><span class="text-3xl">✅</span><div class="flex-1"><div class="font-bold text-white text-lg">Todo Tranquilo</div><div class="text-green-200 text-sm">No tienes eventos próximos en los siguientes 7 días</div></div></div></div>';
    }
    
    return banners;
}

function showTodayEvents() {
    var upcoming = getUpcomingEvents();
    showEventsList(upcoming.today, 'Eventos de HOY');
}

function showTomorrowEvents() {
    var upcoming = getUpcomingEvents();
    showEventsList(upcoming.tomorrow, 'Eventos de MAÑANA');
}

function showWeekEvents() {
    var upcoming = getUpcomingEvents();
    showEventsList(upcoming.week, 'Eventos de esta SEMANA');
}

function showEventsList(eventsList, title) {
    var html = '<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-dark-card border-glow rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><h3 class="text-2xl font-bold text-gold glow-gold-strong">' + title + '</h3><button onclick="closeModal()" class="text-gold hover:text-yellow-400 text-3xl">×</button></div><div class="space-y-3">';
    
    if (eventsList.length === 0) {
        html += '<p class="text-gray-400 text-center py-8">No hay eventos</p>';
    } else {
        for (var i = 0; i < eventsList.length; i++) {
            var ev = eventsList[i];
            html += '<div class="p-4 bg-gray-900 rounded-lg border-l-4 ' + getBorderColor(ev.type) + '"><div class="font-bold text-white text-lg">' + ev.title + '</div><div class="text-gray-400 text-sm mt-1">📅 ' + formatDateReadable(ev.date) + '</div><div class="text-gray-400 text-sm">⏰ ' + (ev.time || 'Sin hora especificada') + '</div>';
            if (ev.cost) html += '<div class="text-gray-400 text-sm">💰 $' + ev.cost + '</div>';
            if (ev.description) html += '<div class="text-gray-300 text-sm mt-2">' + ev.description + '</div>';
            html += '</div>';
        }
    }
    
    html += '</div></div></div>';
    document.getElementById('modals').innerHTML = html;
}

function showStatsModal() {
    var html = '<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-dark-card border-glow rounded-xl p-6 max-w-4xl w-full max-h-screen overflow-y-auto" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-6"><h3 class="text-3xl font-bold text-gold glow-gold-strong">📊 ESTADÍSTICAS Y GRÁFICAS</h3><button onclick="closeModal()" class="text-gold hover:text-yellow-400 text-3xl">×</button></div>';
    
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">';
    html += '<div class="bg-gray-900 border border-gray-700 rounded-lg p-4"><h4 class="text-xl font-bold text-gold mb-4">Asistencias por Alumno</h4><canvas id="attendanceChart"></canvas></div>';
    html += '<div class="bg-gray-900 border border-gray-700 rounded-lg p-4"><h4 class="text-xl font-bold text-gold mb-4">Participaciones por Alumno</h4><canvas id="participationChart"></canvas></div>';
    html += '</div>';
    
    html += '<div class="bg-gray-900 border border-gray-700 rounded-lg p-4"><h4 class="text-xl font-bold text-gold mb-4">🏆 TOP 5 ALUMNOS</h4><div id="topStudents"></div></div>';
    
    html += '</div></div>';
    document.getElementById('modals').innerHTML = html;
    
    setTimeout(function() {
        createAttendanceChart();
        createParticipationChart();
        showTopStudents();
    }, 100);
}

function createAttendanceChart() {
    var ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    var labels = [];
    var data = [];
    
    for (var uid in students) {
        labels.push(students[uid].name);
        var stats = getStudentStats(uid);
        data.push(stats.attendance);
    }
    
    if (attendanceChart) attendanceChart.destroy();
    
    attendanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Asistencias',
                data: data,
                backgroundColor: 'rgba(255, 215, 0, 0.6)',
                borderColor: 'rgba(255, 215, 0, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#FFD700', font: { size: 14, weight: 'bold' } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#FFD700', stepSize: 1 },
                    grid: { color: 'rgba(255, 215, 0, 0.1)' }
                },
                x: {
                    ticks: { color: '#FFD700' },
                    grid: { color: 'rgba(255, 215, 0, 0.1)' }
                }
            }
        }
    });
}

function createParticipationChart() {
    var ctx = document.getElementById('participationChart');
    if (!ctx) return;
    
    var labels = [];
    var data = [];
    
    for (var uid in students) {
        labels.push(students[uid].name);
        var stats = getStudentStats(uid);
        data.push(stats.participation);
    }
    
    if (participationChart) participationChart.destroy();
    
    participationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Participaciones',
                data: data,
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#22C55E', font: { size: 14, weight: 'bold' } }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#22C55E', stepSize: 1 },
                    grid: { color: 'rgba(34, 197, 94, 0.1)' }
                },
                x: {
                    ticks: { color: '#22C55E' },
                    grid: { color: 'rgba(34, 197, 94, 0.1)' }
                }
            }
        }
    });
}

function showTopStudents() {
    var studentArray = [];
    for (var uid in students) {
        var stats = getStudentStats(uid);
        studentArray.push({
            name: students[uid].name,
            attendance: stats.attendance,
            participation: stats.participation,
            total: stats.attendance + stats.participation
        });
    }
    
    studentArray.sort(function(a, b) { return b.total - a.total; });
    
    var html = '<div class="space-y-3">';
    for (var i = 0; i < Math.min(5, studentArray.length); i++) {
        var student = studentArray[i];
        var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅';
        html += '<div class="flex items-center justify-between p-4 bg-gray-800 border-2 border-yellow-600 rounded-lg glow-gold"><div class="flex items-center gap-3"><span class="text-3xl">' + medal + '</span><div><div class="font-bold text-white text-lg">' + student.name + '</div><div class="text-gray-400 text-sm">Asistencias: ' + student.attendance + ' | Participaciones: ' + student.participation + '</div></div></div><div class="text-3xl font-bold text-gold">' + student.total + '</div></div>';
    }
    html += '</div>';
    
    document.getElementById('topStudents').innerHTML = html;
}

function showLoginScreen() {
    document.getElementById('app').innerHTML = '<div class="min-h-screen flex items-center justify-center p-4"><div class="bg-dark-card border-glow rounded-2xl shadow-2xl p-8 max-w-md w-full"><div class="text-center mb-8"><div class="w-32 h-32 mx-auto mb-4 rounded-full glow-gold bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center"><span class="text-6xl">📅</span></div><h1 class="text-4xl font-bold text-gold glow-gold-strong retro-title mb-2">CALENDARIO</h1><p class="text-gray-300">Gestión de clases y asistencias</p></div><div class="flex gap-2 mb-6"><button onclick="showTab(\'login\')" id="loginTab" class="flex-1 py-2 px-4 rounded-lg font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">Iniciar Sesión</button><button onclick="showTab(\'register\')" id="registerTab" class="flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-700 text-gray-300">Registrarse</button></div><div id="loginForm"><div class="space-y-4"><input type="email" id="loginEmail" placeholder="Email" class="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none placeholder-gray-500"><input type="password" id="loginPassword" placeholder="Contraseña" class="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none placeholder-gray-500"><button onclick="login()" class="w-full btn-gold py-3 rounded-lg transition">ENTRAR</button></div></div><div id="registerForm" class="hidden"><div class="space-y-4"><input type="text" id="registerName" placeholder="Nombre completo" class="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none placeholder-gray-500"><input type="email" id="registerEmail" placeholder="Email" class="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none placeholder-gray-500"><input type="password" id="registerPassword" placeholder="Contraseña (mínimo 6 caracteres)" class="w-full px-4 py-3 bg-gray-900 border-2 border-yellow-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none placeholder-gray-500"><button onclick="register()" class="w-full btn-gold py-3 rounded-lg transition">CREAR CUENTA</button></div></div><div id="authMessage" class="mt-4 text-center text-sm"></div></div></div>';
}

function showTab(tab) {
    if (tab === 'login') {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black';
        document.getElementById('registerTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-700 text-gray-300';
    } else {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gray-700 text-gray-300';
        document.getElementById('registerTab').className = 'flex-1 py-2 px-4 rounded-lg font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 text-black';
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
    if (!name || !email || !password) { showMessage('Completa todos los campos', 'error'); return; }
    auth.createUserWithEmailAndPassword(email, password).then(function(u) {
        return db.ref('users/' + u.user.uid).set({name: name, email: email, role: 'student', createdAt: Date.now()});
    }).then(function() { showMessage('Cuenta creada como Alumno', 'success'); }).catch(function(e) { showMessage('Error: ' + e.message, 'error'); });
}

function showMessage(msg, type) {
    var div = document.getElementById('authMessage');
    if (div) { div.textContent = msg; div.className = 'mt-4 text-center text-sm ' + (type === 'error' ? 'text-red-400' : 'text-green-400'); }
}

function logout() { auth.signOut(); }

function getEventColor(type) {
    return {clase:'bg-blue-900 text-blue-300 border border-blue-500', reunion:'bg-purple-900 text-purple-300 border border-purple-500', examen:'bg-green-900 text-green-300 border border-green-500', evento:'bg-yellow-900 text-yellow-300 border border-yellow-500'}[type] || 'bg-gray-800 text-gray-300';
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
        cal += '<div class="calendar-day border-2 ' + (isToday ? 'border-yellow-500 bg-yellow-900 bg-opacity-20 glow-gold' : 'border-gray-700 bg-gray-900') + ' rounded-lg p-2 cursor-pointer hover:border-yellow-600 transition" onclick="selectDate(\'' + dateStr + '\')"><div class="font-semibold text-white mb-1">' + day + '</div><div class="space-y-1">';
        for (var j = 0; j < dayEvs.length; j++) cal += '<div class="text-xs px-2 py-1 rounded truncate ' + getEventColor(dayEvs[j].type) + '">' + dayEvs[j].title + '</div>';
        cal += '</div></div>';
    }
    var isAdmin = currentUser.role === 'admin';
    var stuCnt = 0, stuHTML = '';
    for (var uid in students) {
        stuCnt++;
        var stats = getStudentStats(uid);
        stuHTML += '<div class="p-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-yellow-600 transition"><div class="font-semibold text-white">' + students[uid].name + '</div><div class="text-xs text-gray-400 mt-1 flex gap-3"><span>✓ ' + stats.attendance + '</span><span>⭐ ' + stats.participation + '</span></div></div>';
    }
    
    var reminderHTML = showReminderBanner();
    
    var userManagementHTML = '';
    if (isAdmin) {
        var adminCount = 0, studentCount = 0;
        for (var uid in allUsers) {
            if (allUsers[uid].role === 'admin') adminCount++;
            else studentCount++;
        }
        userManagementHTML = '<div class="bg-dark-card border-glow rounded-xl shadow-2xl p-6 mb-6"><h3 class="text-2xl font-bold text-gold glow-gold-strong mb-4 flex items-center gap-2"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>GESTIÓN DE USUARIOS</h3><div class="grid grid-cols-2 gap-4 mb-4"><div class="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded-lg text-center glow-gold"><div class="text-3xl font-bold text-gold">' + adminCount + '</div><div class="text-sm text-gray-300">Administradores</div></div><div class="bg-green-900 bg-opacity-30 border border-green-600 p-4 rounded-lg text-center"><div class="text-3xl font-bold text-green-400">' + studentCount + '</div><div class="text-sm text-gray-300">Alumnos</div></div></div><button onclick="showUserManagementModal()" class="w-full btn-gold py-3 rounded-lg transition mb-3">VER TODOS LOS USUARIOS</button><button onclick="showStatsModal()" class="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 rounded-lg transition">📊 VER ESTADÍSTICAS</button></div>';
    }
    
    var html = '<div class="max-w-7xl mx-auto p-4"><div class="bg-dark-card border-glow rounded-xl shadow-2xl p-6 mb-6"><div class="flex justify-between items-center flex-wrap gap-4"><div class="flex items-center gap-4"><div class="w-16 h-16 rounded-full glow-gold bg-gradient-to-br from-yellow-600 to-yellow-800 flex items-center justify-center"><span class="text-3xl">📅</span></div><div><h1 class="text-3xl font-bold text-gold glow-gold-strong retro-title">CALENDARIO</h1><p class="text-gray-300 mt-1"><span class="font-semibold text-white">' + currentUser.name + '</span><span class="ml-2 text-sm ' + (isAdmin ? 'bg-yellow-600 text-black' : 'bg-green-600 text-black') + ' px-3 py-1 rounded-full font-bold">' + (isAdmin ? 'ADMIN' : 'ALUMNO') + '</span></p></div></div><button onclick="logout()" class="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg transition">Salir</button></div></div>';
    
    html += reminderHTML;
    
    if (isAdmin) html += userManagementHTML;
    
    html += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2"><div class="bg-dark-card border-glow rounded-xl shadow-2xl p-6"><div class="flex justify-between items-center mb-6"><button onclick="changeMonth(-1)" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-bold transition">←</button><h2 class="text-3xl font-bold text-gold glow-gold-strong">' + monthNames[month] + ' ' + year + '</h2><button onclick="changeMonth(1)" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg font-bold transition">→</button></div><div class="grid grid-cols-7 gap-2 mb-2">';
    for (var i = 0; i < 7; i++) html += '<div class="text-center font-bold text-gold py-2">' + dayNames[i] + '</div>';
    html += '</div><div class="grid grid-cols-7 gap-2">' + cal + '</div></div></div><div class="space-y-6"><div id="sidePanel" class="bg-dark-card border-glow rounded-xl shadow-2xl p-6"><h3 class="text-xl font-bold text-gold glow-gold-strong mb-4">INFORMACIÓN</h3><p class="text-gray-400">Selecciona un día</p></div>';
    if (isAdmin) html += '<div class="bg-dark-card border-glow rounded-xl shadow-2xl p-6"><h3 class="text-xl font-bold text-gold glow-gold-strong mb-4">ALUMNOS (' + stuCnt + ')</h3><div class="space-y-2 max-h-64 overflow-y-auto">' + stuHTML + '</div></div>';
    else html += '<div class="bg-dark-card border-glow rounded-xl shadow-2xl p-6"><h3class="text-xl font-bold text-gold glow-gold-strong mb-4">MIS ESTADÍSTICAS</h3><div>' + getMyStatsHTML() + '</div></div>';
html += '</div></div></div><div id="modals"></div>';
document.getElementById('app').innerHTML = html;
}
function showUserManagementModal() {
var html = '<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-dark-card border-glow rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><h3 class="text-2xl font-bold text-gold glow-gold-strong">GESTIÓN DE USUARIOS</h3><button onclick="closeModal()" class="text-gold hover:text-yellow-400 text-3xl">×</button></div><div class="space-y-3">';
for (var uid in allUsers) {
    var user = allUsers[uid];
    var isCurrentUser = uid === currentUser.uid;
    var roleColor = user.role === 'admin' ? 'bg-yellow-600 text-black' : 'bg-green-600 text-black';
    var roleText = user.role === 'admin' ? 'ADMIN' : 'ALUMNO';
    
    html += '<div class="flex justify-between items-center p-4 bg-gray-900 rounded-lg border-2 ' + (isCurrentUser ? 'border-yellow-500 glow-gold' : 'border-gray-700') + '">';
    html += '<div class="flex-1"><div class="font-semibold text-white">' + user.name + (isCurrentUser ? ' (Tú)' : '') + '</div><div class="text-sm text-gray-400">' + user.email + '</div></div>';
    html += '<div class="flex items-center gap-2"><span class="text-xs px-3 py-1 rounded-full font-bold ' + roleColor + '">' + roleText + '</span>';
    
    if (!isCurrentUser) {
        if (user.role === 'student') {
            html += '<button onclick="promoteUser(\'' + uid + '\')" class="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-black rounded text-sm font-bold">↑ Admin</button>';
        } else {
            html += '<button onclick="demoteUser(\'' + uid + '\')" class="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-bold">↓ Alumno</button>';
        }
        html += '<button onclick="deleteUser(\'' + uid + '\')" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-bold">✕</button>';
    }
    
    html += '</div></div>';
}

html += '</div></div></div>';
document.getElementById('modals').innerHTML = html;
}
function promoteUser(uid) {
if (confirm('¿Promover este usuario a Administrador?')) {
db.ref('users/' + uid + '/role').set('admin').then(function() {
alert('Usuario promovido a Administrador');
});
}
}
function demoteUser(uid) {
if (confirm('¿Degradar este administrador a Alumno?')) {
db.ref('users/' + uid + '/role').set('student').then(function() {
alert('Usuario degradado a Alumno');
});
}
}
function deleteUser(uid) {
if (confirm('¿ELIMINAR este usuario permanentemente?')) {
db.ref('users/' + uid).remove().then(function() {
alert('Usuario eliminado');
});
}
}
function selectDate(dateStr) {
var dayEvs = [];
for (var id in events) if (events[id].date === dateStr) dayEvs.push(events[id]);
var isAdmin = currentUser.role === 'admin';
var html = '<h3 class="text-xl font-bold text-gold glow-gold-strong mb-4">' + formatDateReadable(dateStr) + '</h3>';
if (dayEvs.length === 0) html += '<p class="text-gray-400 mb-4">No hay eventos</p>';
else {
for (var i = 0; i < dayEvs.length; i++) {
var ev = dayEvs[i];
html += '<div class="mb-4 p-4 bg-gray-900 rounded-lg border-l-4 ' + getBorderColor(ev.type) + '"><div class="flex justify-between items-start mb-2"><h4 class="font-bold text-white text-lg">' + ev.title + '</h4>';
if (isAdmin) html += '<button onclick="deleteEvent(\'' + ev.id + '\')" class="text-red-500 hover:text-red-400">🗑️</button>';
html += '</div><p class="text-sm text-gray-400 mb-1">⏰ ' + (ev.time || 'Sin hora') + '</p>';
if (ev.cost) html += '<p class="text-sm text-gray-400 mb-1">💰 $' + ev.cost + '</p>';
if (ev.description) html += '<p class="text-sm text-gray-300 mt-2">' + ev.description + '</p>';
if (isAdmin) html += '<button onclick="showAttendanceModal(\'' + ev.id + '\')" class="mt-3 btn-gold px-4 py-2 rounded-lg text-sm">📋 PASAR LISTA</button>';
html += '</div>';
}
}
if (isAdmin) html += '<button onclick="showAddEventModal(\'' + dateStr + '\')" class="w-full mt-4 btn-gold py-3 rounded-lg font-bold">➕ AGREGAR EVENTO</button>';
document.getElementById('sidePanel').innerHTML = html;
}
function showAddEventModal(dateStr) {
document.getElementById('modals').innerHTML = '<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-dark-card border-glow rounded-xl p-6 max-w-md w-full" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gold glow-gold-strong">AGREGAR EVENTO</h3><button onclick="closeModal()" class="text-gold hover:text-yellow-400 text-3xl">×</button></div><div class="space-y-4"><input type="text" id="eventTitle" placeholder="Título" class="w-full px-4 py-2 bg-gray-900 border-2 border-yellow-600 text-white rounded-lg focus:outline-none placeholder-gray-500"><select id="eventType" class="w-full px-4 py-2 bg-gray-900 border-2 border-yellow-600 text-white rounded-lg focus:outline-none"><option value="clase">Clase</option><option value="reunion">Reunión</option><option value="examen">Examen</option><option value="evento">Evento</option></select><input type="time" id="eventTime" class="w-full px-4 py-2 bg-gray-900 border-2 border-yellow-600 text-white rounded-lg focus:outline-none"><input type="number" id="eventCost" placeholder="Costo" class="w-full px-4 py-2 bg-gray-900 border-2 border-yellow-600 text-white rounded-lg focus:outline-none placeholder-gray-500"><textarea id="eventDescription" placeholder="Descripción" rows="3" class="w-full px-4 py-2 bg-gray-900 border-2 border-yellow-600 text-white rounded-lg focus:outline-none placeholder-gray-500"></textarea><button onclick="addEvent(\'' + dateStr + '\')" class="w-full btn-gold py-2 rounded-lg font-bold">GUARDAR</button></div></div></div>';
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
var html = '<div class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onclick="closeModal(event)"><div class="bg-dark-card border-glow rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto" onclick="event.stopPropagation()"><div class="flex justify-between items-center mb-4"><div><h3 class="text-xl font-bold text-gold glow-gold-strong">PASAR LISTA</h3><p class="text-sm text-gray-400">' + ev.title + '</p></div><button onclick="closeModal()" class="text-gold hover:text-yellow-400 text-3xl">×</button></div><div class="space-y-2">';
for (var uid in students) {
var stu = students[uid];
var attKey = eventId + '-' + uid;
var isPresent = attendance[attKey] || false;
html += '<div class="flex justify-between items-center p-3 bg-gray-900 border border-gray-700 rounded-lg"><span class="font-medium text-white">' + stu.name + '</span><div class="flex gap-2"><button onclick="toggleAttendance(\'' + eventId + '\',\'' + uid + '\')" class="px-4 py-1 rounded font-bold ' + (isPresent ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400') + '">' + (isPresent ? '✓ Presente' : 'Ausente') + '</button><button onclick="addParticipation(\'' + uid + '\')" class="px-3 py-1 bg-yellow-600 text-black rounded font-bold">+1 ⭐</button></div></div>';
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
return '<div class="space-y-3"><div class="flex items-center justify-between p-3 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg"><span class="text-gray-300">✓ Asistencias</span><span class="font-bold text-blue-400 text-2xl">' + stats.attendance + '</span></div><div class="flex items-center justify-between p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg glow-gold"><span class="text-gray-300">⭐ Participaciones</span><span class="font-bold text-gold text-2xl">' + stats.participation + '</span></div></div>';
}
function closeModal(event) { if (!event || event.target === event.currentTarget) document.getElementById('modals').innerHTML = ''; }
showLoginScreen();
