/**
 * PaperDesk - Core Application Logic
 * Integrates:
 * 1. Personal Authentication & Paper Desk Hub
 * 2. TaskMaster (Tasks, Search, Priority, Empty State)
 * 3. Budget Dealer (Income, Expenses, Net Balance, Ledger, Search)
 * 4. Diet Helper (Meals, Calorie Counter, Hydration Tracker, Search)
 */

// ==========================================
// STORAGE KEYS & GLOBAL STATE
// ==========================================
const STORAGE = {
  USER: 'paperdesk_user',
  USERS: 'paperdesk_registered_users'
};

// Default sample registered user
const DEFAULT_REGISTERED_USERS = [
  { id: 'usr_alex', name: 'Alex', email: 'alex@paperdesk.com', password: 'paper123', createdAt: new Date().toISOString() }
];

// Default sample common monthly expenses
const DEFAULT_COMMON_EXPENSES = [
  { id: 'c_1', name: 'Apartment Rent / Mortgage', category: 'Housing', amount: 1200 },
  { id: 'c_2', name: 'Electricity, Water & Gas', category: 'Utilities', amount: 130 },
  { id: 'c_3', name: 'High-Speed Wi-Fi & Mobile Phone', category: 'Subscriptions', amount: 85 },
  { id: 'c_4', name: 'Health Insurance & Gym', category: 'Health', amount: 65 }
];

// Registered Users Database
let registeredUsers = JSON.parse(localStorage.getItem(STORAGE.USERS));
if (!registeredUsers || !Array.isArray(registeredUsers) || registeredUsers.length === 0) {
  registeredUsers = DEFAULT_REGISTERED_USERS;
  localStorage.setItem(STORAGE.USERS, JSON.stringify(registeredUsers));
}

// Current logged in user
let currentUser = JSON.parse(localStorage.getItem(STORAGE.USER)) || null;

// User-scoped Data Storage Helpers
function getUserDataKey(type) {
  const emailKey = (currentUser?.email || 'alex@paperdesk.com').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `paperdesk_${emailKey}_${type}`;
}

// App State Variables (per active user)
let tasks = [];
let monthlySalary = 4000;
let commonExpenses = [...DEFAULT_COMMON_EXPENSES];
let budgetTransactions = [];
let dietMeals = [];
let waterGlasses = 0;

function loadCurrentUserData() {
  if (!currentUser) return;
  tasks = JSON.parse(localStorage.getItem(getUserDataKey('tasks'))) || [];
  monthlySalary = parseFloat(localStorage.getItem(getUserDataKey('salary'))) || 4000;
  commonExpenses = JSON.parse(localStorage.getItem(getUserDataKey('common_expenses'))) || [...DEFAULT_COMMON_EXPENSES];
  budgetTransactions = JSON.parse(localStorage.getItem(getUserDataKey('budget'))) || [];
  dietMeals = JSON.parse(localStorage.getItem(getUserDataKey('meals'))) || [];
  waterGlasses = parseInt(localStorage.getItem(getUserDataKey('water')), 10) || 0;
}

function saveTasks() {
  localStorage.setItem(getUserDataKey('tasks'), JSON.stringify(tasks));
}
function saveSalary() {
  localStorage.setItem(getUserDataKey('salary'), monthlySalary);
}
function saveCommonExpenses() {
  localStorage.setItem(getUserDataKey('common_expenses'), JSON.stringify(commonExpenses));
}
function saveBudget() {
  localStorage.setItem(getUserDataKey('budget'), JSON.stringify(budgetTransactions));
}
function saveDietMeals() {
  localStorage.setItem(getUserDataKey('meals'), JSON.stringify(dietMeals));
}
function saveDietWater() {
  localStorage.setItem(getUserDataKey('water'), waterGlasses);
}

// Filter States
let taskFilter = 'all'; // 'all' | 'pending' | 'completed'
let taskSearch = '';

let budgetFilter = 'all'; // 'all' | 'income' | 'expense'
let budgetSearch = '';

let dietFilter = 'all'; // 'all' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
let dietSearch = '';

// ==========================================
// DOM ELEMENTS
// ==========================================
// Views
const loginView = document.getElementById('login-view');
const workspaceView = document.getElementById('workspace-view');
const subviews = document.querySelectorAll('.app-subview');
const notebookTabs = document.querySelectorAll('.notebook-tab');

// Auth Tabs & Form Elements
const authTabSignin = document.getElementById('auth-tab-signin');
const authTabSignup = document.getElementById('auth-tab-signup');
const signinContainer = document.getElementById('signin-container');
const signupContainer = document.getElementById('signup-container');
const linkToRegister = document.getElementById('link-to-register');
const linkToSignin = document.getElementById('link-to-signin');

// Login Elements
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePwdBtn = document.getElementById('toggle-pwd-btn');
const logoutBtn = document.getElementById('logout-btn');

// Register Elements
const registerForm = document.getElementById('register-form');
const regNameInput = document.getElementById('reg-name');
const regEmailInput = document.getElementById('reg-email');
const regPasswordInput = document.getElementById('reg-password');
const toggleRegPwdBtn = document.getElementById('toggle-reg-pwd-btn');

// Header & User Display Elements
const userDisplayName = document.getElementById('user-display-name');
const hubUserName = document.getElementById('hub-user-name');
const userAvatar = document.getElementById('user-avatar');
const currentDateStamp = document.getElementById('current-date-stamp');

// Hub Stats
const hubTaskStat = document.getElementById('hub-task-stat');
const hubBudgetStat = document.getElementById('hub-budget-stat');
const hubDietStat = document.getElementById('hub-diet-stat');

// TaskMaster Elements
const taskSearchInput = document.getElementById('task-search-input');
const taskSearchClear = document.getElementById('task-search-clear');
const taskResetSearchBtn = document.getElementById('task-reset-search-btn');
const openAddTaskBtn = document.getElementById('open-add-task-btn');
const emptyAddTaskBtn = document.getElementById('empty-add-task-btn');
const taskListEl = document.getElementById('task-list');
const taskEmptyState = document.getElementById('task-empty-state');
const taskNoResults = document.getElementById('task-no-results');
const countAll = document.getElementById('count-all');
const countPending = document.getElementById('count-pending');
const countCompleted = document.getElementById('count-completed');
const taskFilterChips = document.querySelectorAll('.filter-chip');

// Task Modal Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskModalClose = document.getElementById('task-modal-close');
const taskModalCancel = document.getElementById('task-modal-cancel');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskCategoryInput = document.getElementById('task-category-input');
const taskPriorityInput = document.getElementById('task-priority-input');
const taskDueDate = document.getElementById('task-due-date');

// Budget Dealer Elements
const monthlySalaryInput = document.getElementById('monthly-salary-input');
const saveSalaryBtn = document.getElementById('save-salary-btn');
const budgetSalaryVal = document.getElementById('budget-salary-val');
const budgetCommonTotal = document.getElementById('budget-common-total');
const budgetCommonCount = document.getElementById('budget-common-count');
const budgetLeftAfterCommon = document.getElementById('budget-left-after-common');
const budgetLeftAfterCommonPct = document.getElementById('budget-left-after-common-pct');
const budgetTotalExpense = document.getElementById('budget-total-expense');
const budgetNetBalance = document.getElementById('budget-net-balance');

// Common Expenses Elements
const openAddCommonBtn = document.getElementById('open-add-common-btn');
const btnQuickAddCommon = document.getElementById('btn-quick-add-common');
const commonExpensesTbody = document.getElementById('common-expenses-tbody');
const tableTotalCommon = document.getElementById('table-total-common');
const calloutLeftAfterCommon = document.getElementById('callout-left-after-common');
const calloutSalaryDisp = document.getElementById('callout-salary-disp');
const calloutCommonDisp = document.getElementById('callout-common-disp');

// Common Expense Modal Elements
const commonExpenseModal = document.getElementById('common-expense-modal');
const commonExpenseForm = document.getElementById('common-expense-form');
const commonModalClose = document.getElementById('common-modal-close');
const commonModalCancel = document.getElementById('common-modal-cancel');
const commonNameInput = document.getElementById('common-name-input');
const commonCategoryInput = document.getElementById('common-category-input');
const commonAmountInput = document.getElementById('common-amount-input');

// Daily Ledger Elements
const btnQuickAddDaily = document.getElementById('btn-quick-add-daily');
const openAddTransBtn = document.getElementById('open-add-transaction-btn');
const emptyAddTransBtn = document.getElementById('empty-add-trans-btn');
const budgetSearchInput = document.getElementById('budget-search-input');
const budgetSearchClear = document.getElementById('budget-search-clear');
const budgetResetSearchBtn = document.getElementById('budget-reset-search-btn');
const budgetEmptyState = document.getElementById('budget-empty-state');
const budgetNoResults = document.getElementById('budget-no-results');
const emptyLeftMoneyDisp = document.getElementById('empty-left-money-disp');
const dailyLedgerTableWrapper = document.getElementById('daily-ledger-table-wrapper');
const dailyLedgerTbody = document.getElementById('daily-ledger-tbody');
const bcountAll = document.getElementById('bcount-all');
const bcountIncome = document.getElementById('bcount-income');
const bcountExpense = document.getElementById('bcount-expense');
const budgetFilterChips = document.querySelectorAll('.budget-filter-chip');

// Budget Modal Elements
const budgetModal = document.getElementById('budget-modal');
const budgetForm = document.getElementById('budget-form');
const budgetModalClose = document.getElementById('budget-modal-close');
const budgetModalCancel = document.getElementById('budget-modal-cancel');
const transTitleInput = document.getElementById('trans-title-input');
const transTypeInput = document.getElementById('trans-type-input');
const transAmountInput = document.getElementById('trans-amount-input');
const transCategoryInput = document.getElementById('trans-category-input');
const transDateInput = document.getElementById('trans-date-input');

// Diet Helper Elements
const totalCaloriesNum = document.getElementById('total-calories-num');
const calorieProgressBar = document.getElementById('calorie-progress-bar');
const calorieRemainingNote = document.getElementById('calorie-remaining-note');
const waterCountNum = document.getElementById('water-count-num');
const glassesVisualIcons = document.getElementById('glasses-visual-icons');
const waterPlusBtn = document.getElementById('water-plus-btn');
const waterMinusBtn = document.getElementById('water-minus-btn');
const dietSearchInput = document.getElementById('diet-search-input');
const dietSearchClear = document.getElementById('diet-search-clear');
const dietResetSearchBtn = document.getElementById('diet-reset-search-btn');
const openLogMealBtn = document.getElementById('open-log-meal-btn');
const emptyAddMealBtn = document.getElementById('empty-add-meal-btn');
const dietMealsListEl = document.getElementById('diet-meals-list');
const dietEmptyState = document.getElementById('diet-empty-state');
const dietNoResults = document.getElementById('diet-no-results');
const dcountAll = document.getElementById('dcount-all');
const dietFilterChips = document.querySelectorAll('.diet-filter-chip');

// Diet Modal Elements
const dietModal = document.getElementById('diet-modal');
const dietForm = document.getElementById('diet-form');
const dietModalClose = document.getElementById('diet-modal-close');
const dietModalCancel = document.getElementById('diet-modal-cancel');
const mealNameInput = document.getElementById('meal-name-input');
const mealTypeInput = document.getElementById('meal-type-input');
const mealCalInput = document.getElementById('meal-cal-input');
const mealNotesInput = document.getElementById('meal-notes-input');

// Toast
const paperToastEl = document.getElementById('paper-toast');

// ==========================================
// APP INITIALIZATION
// ==========================================
function initApp() {
  setupNavigation();
  setupEventListeners();
  setDateStamp();

  if (currentUser) {
    loadCurrentUserData();
  }

  // Show the login & register page on initial load
  showLogin();
}

function setDateStamp() {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  if (currentDateStamp) {
    currentDateStamp.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

// ==========================================
// VIEW SWITCHING & USER BRANDING
// ==========================================
function showLogin() {
  workspaceView.classList.remove('active');
  loginView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showWorkspace(showWelcomeToast = true) {
  loginView.classList.remove('active');
  workspaceView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Update personalized branding across the workspace
  const name = currentUser?.name || 'Alex';
  
  // Top corner avatar & desk title
  if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
  if (userDisplayName) userDisplayName.textContent = name;
  if (hubUserName) hubUserName.textContent = name;

  // Refresh all sub-apps with active user's data
  renderTaskMaster();
  renderBudgetDealer();
  renderDietHelper();
  updateHubSummary();

  if (showWelcomeToast) {
    showToast(`Welcome back, ${name}! ✍️`);
  }
}

function navigateToSection(targetId) {
  subviews.forEach(view => {
    view.classList.toggle('active', view.id === targetId);
  });

  notebookTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.target === targetId);
  });

  // Re-render when entering specific sections
  if (targetId === 'hub-view') updateHubSummary();
  if (targetId === 'taskmaster-view') renderTaskMaster();
  if (targetId === 'budget-view') renderBudgetDealer();
  if (targetId === 'diet-view') renderDietHelper();
}

window.navigateToSection = navigateToSection;

function setupNavigation() {
  notebookTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navigateToSection(tab.dataset.target);
    });
  });
}

function updateHubSummary() {
  // Tasks count
  const pendingTasks = tasks.filter(t => !t.completed).length;
  if (hubTaskStat) hubTaskStat.textContent = `${pendingTasks} pending task${pendingTasks === 1 ? '' : 's'}`;

  // Budget summary
  const totalCommon = commonExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  let totalVarExpense = 0;
  let totalVarIncome = 0;
  budgetTransactions.forEach(t => {
    if (t.type === 'expense') totalVarExpense += Number(t.amount || 0);
    else totalVarIncome += Number(t.amount || 0);
  });
  const moneyLeft = monthlySalary - totalCommon - totalVarExpense + totalVarIncome;
  if (hubBudgetStat) hubBudgetStat.textContent = `Money Left: ${moneyLeft >= 0 ? '₹' : '-₹'}${Math.abs(moneyLeft).toFixed(2)}`;

  // Diet summary
  const totalCal = dietMeals.reduce((acc, m) => acc + Number(m.calories || 0), 0);
  if (hubDietStat) hubDietStat.textContent = `${totalCal} kcal logged today`;
}

// ==========================================
// AUTHENTICATION & REGISTRATION LOGIC
// ==========================================
// Tab switching (Sign In vs Register)
function switchToSignInTab() {
  if (authTabSignin) authTabSignin.classList.add('active');
  if (authTabSignup) authTabSignup.classList.remove('active');
  if (signinContainer) signinContainer.classList.add('active');
  if (signupContainer) signupContainer.classList.remove('active');
}

function switchToRegisterTab() {
  if (authTabSignin) authTabSignin.classList.remove('active');
  if (authTabSignup) authTabSignup.classList.add('active');
  if (signinContainer) signinContainer.classList.remove('active');
  if (signupContainer) signupContainer.classList.add('active');
  setTimeout(() => { if (regNameInput) regNameInput.focus(); }, 100);
}

if (authTabSignin) authTabSignin.addEventListener('click', switchToSignInTab);
if (authTabSignup) authTabSignup.addEventListener('click', switchToRegisterTab);
if (linkToRegister) linkToRegister.addEventListener('click', switchToRegisterTab);
if (linkToSignin) linkToSignin.addEventListener('click', switchToSignInTab);

// Password visibility toggles
if (togglePwdBtn) {
  togglePwdBtn.addEventListener('click', () => {
    const isPwd = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPwd ? 'text' : 'password');
    togglePwdBtn.textContent = isPwd ? '🙈' : '👁️';
  });
}

if (toggleRegPwdBtn) {
  toggleRegPwdBtn.addEventListener('click', () => {
    const isPwd = regPasswordInput.getAttribute('type') === 'password';
    regPasswordInput.setAttribute('type', isPwd ? 'text' : 'password');
    toggleRegPwdBtn.textContent = isPwd ? '🙈' : '👁️';
  });
}

// Demo Credentials Auto-Fill
const demoFillBtn = document.getElementById('demo-fill-btn');
if (demoFillBtn) {
  demoFillBtn.addEventListener('click', () => {
    usernameInput.value = 'alex@paperdesk.com';
    passwordInput.value = 'paper123';
    showToast('Demo credentials restored 📌');
  });
}

// 1. SIGN IN SUBMIT
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rawInput = usernameInput.value.trim().toLowerCase();
  const enteredPassword = passwordInput.value;

  if (!rawInput || !enteredPassword) {
    showToast('Please enter both your email/username and password!');
    return;
  }

  // Check if account exists
  const matchedUser = registeredUsers.find(u =>
    u.email.toLowerCase() === rawInput ||
    u.name.toLowerCase() === rawInput
  );

  // If user does not exist, ask them to register first!
  if (!matchedUser) {
    showToast('⚠️ No account found with this email! Please register first ✍️');
    if (regEmailInput && rawInput.includes('@')) {
      regEmailInput.value = rawInput;
    }
    switchToRegisterTab();
    return;
  }

  // Check password
  if (matchedUser.password !== enteredPassword) {
    showToast('🔒 Incorrect password! Please try again.');
    return;
  }

  // Successful Login
  currentUser = { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email };
  localStorage.setItem(STORAGE.USER, JSON.stringify(currentUser));

  // Load user data & enter desk
  loadCurrentUserData();
  showWorkspace(true);
});

// 2. REGISTER NEW USER SUBMIT
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = regNameInput.value.trim();
    const email = regEmailInput.value.trim().toLowerCase();
    const password = regPasswordInput.value;

    if (!name || !email || !password) {
      showToast('Please fill out all registration fields!');
      return;
    }

    // Check if user already exists
    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email);
    if (existingUser) {
      showToast(`An account with ${email} already exists! Switching to Sign In 🔑`);
      usernameInput.value = email;
      passwordInput.value = '';
      switchToSignInTab();
      return;
    }

    // Create and save new user record
    const newUser = {
      id: 'usr_' + Date.now(),
      name: name,
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    registeredUsers.push(newUser);
    localStorage.setItem(STORAGE.USERS, JSON.stringify(registeredUsers));

    // Log the new user in
    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(STORAGE.USER, JSON.stringify(currentUser));

    // Initialize fresh workspace data for the new user
    tasks = [];
    monthlySalary = 4000;
    commonExpenses = [...DEFAULT_COMMON_EXPENSES];
    budgetTransactions = [];
    dietMeals = [];
    waterGlasses = 0;

    saveTasks();
    saveSalary();
    saveCommonExpenses();
    saveBudget();
    saveDietMeals();
    saveDietWater();

    // Clear registration inputs
    registerForm.reset();

    // Open personalized desk
    showWorkspace(false);
    showToast(`Welcome to PaperDesk, ${newUser.name}! Your journal is ready ✍️`);
  });
}

// 3. LOGOUT / LOCK DESK
logoutBtn.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(STORAGE.USER);
  usernameInput.value = '';
  passwordInput.value = '';
  showToast('Journal locked 🔒');
  switchToSignInTab();
  showLogin();
});

// ========================================================
// 1. TASKMASTER MODULE (TASKS, SEARCH, FILTERS)
// ========================================================
function renderTaskMaster() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;

  countAll.textContent = total;
  countPending.textContent = pending;
  countCompleted.textContent = completed;

  // Filter logic
  const filtered = tasks.filter(task => {
    const matchesStatus =
      taskFilter === 'all' ? true :
      taskFilter === 'completed' ? task.completed :
      !task.completed;

    const query = taskSearch.trim().toLowerCase();
    const matchesSearch = !query || (
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.category && task.category.toLowerCase().includes(query)) ||
      (task.priority && task.priority.toLowerCase().includes(query))
    );

    return matchesStatus && matchesSearch;
  });

  // Empty state condition: No tasks at all
  if (tasks.length === 0) {
    taskEmptyState.style.display = 'flex';
    taskNoResults.style.display = 'none';
    taskListEl.style.display = 'none';
    return;
  }

  // Filter/search no results
  if (filtered.length === 0) {
    taskEmptyState.style.display = 'none';
    taskNoResults.style.display = 'flex';
    taskListEl.style.display = 'none';
    return;
  }

  taskEmptyState.style.display = 'none';
  taskNoResults.style.display = 'none';
  taskListEl.style.display = 'flex';

  taskListEl.innerHTML = filtered.map(task => {
    const isDone = task.completed;
    const prioClass = `prio-${(task.priority || 'medium').toLowerCase()}`;
    return `
      <li class="notebook-task-item ${isDone ? 'completed' : ''}">
        <input 
          type="checkbox" 
          class="pencil-checkbox" 
          ${isDone ? 'checked' : ''} 
          title="Mark complete"
          onchange="toggleTask('${task.id}')"
        >
        <div class="item-content">
          <div class="item-title">${escapeHTML(task.title)}</div>
          ${task.description ? `<p class="item-desc">${escapeHTML(task.description)}</p>` : ''}
          <div class="item-meta-row">
            <span class="paper-tag ${prioClass}">● ${task.priority || 'Medium'}</span>
            <span class="paper-tag">${task.category || 'Work'}</span>
            ${task.dueDate ? `<span class="due-stamp">📅 Due: ${task.dueDate}</span>` : ''}
          </div>
        </div>
        <button class="del-btn" title="Delete Task" onclick="deleteTask('${task.id}')">🗑️</button>
      </li>
    `;
  }).join('');
}

window.toggleTask = function(id) {
  const item = tasks.find(t => t.id === id);
  if (!item) return;
  item.completed = !item.completed;
  saveTasks();
  renderTaskMaster();
  updateHubSummary();
  showToast(item.completed ? 'Task completed! ✓' : 'Task reopened');
};

window.deleteTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTaskMaster();
  updateHubSummary();
  showToast('Task removed 🗑️');
};

// Task Search and Filter Events
taskSearchInput.addEventListener('input', (e) => {
  taskSearch = e.target.value;
  taskSearchClear.classList.toggle('visible', taskSearch.length > 0);
  renderTaskMaster();
});

taskSearchClear.addEventListener('click', () => {
  taskSearchInput.value = '';
  taskSearch = '';
  taskSearchClear.classList.remove('visible');
  taskSearchInput.focus();
  renderTaskMaster();
});

taskResetSearchBtn.addEventListener('click', () => {
  taskSearchInput.value = '';
  taskSearch = '';
  taskSearchClear.classList.remove('visible');
  taskFilter = 'all';
  taskFilterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'all'));
  renderTaskMaster();
});

taskFilterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    taskFilterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    taskFilter = chip.dataset.filter;
    renderTaskMaster();
  });
});

// Task Modal
function openTaskModal() {
  taskForm.reset();
  taskDueDate.value = new Date().toISOString().split('T')[0];
  taskModal.classList.add('active');
  setTimeout(() => taskTitleInput.focus(), 100);
}

function closeTaskModal() {
  taskModal.classList.remove('active');
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;

  const newTask = {
    id: 'task_' + Date.now(),
    title: title,
    description: taskDescInput.value.trim(),
    category: taskCategoryInput.value,
    priority: taskPriorityInput.value,
    dueDate: taskDueDate.value,
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  closeTaskModal();
  renderTaskMaster();
  updateHubSummary();
  showToast('Task recorded to journal! 📋');
});


// ========================================================
// 2. BUDGET DEALER MODULE (INCOME, EXPENSES, LEDGER)
// ========================================================
// ========================================================
// 2. BUDGET DEALER MODULE (SALARY, COMMON EXPENSES, MONEY LEFT)
// ========================================================
function renderBudgetDealer() {
  // Sync salary input value
  if (monthlySalaryInput) monthlySalaryInput.value = monthlySalary;
  if (budgetSalaryVal) budgetSalaryVal.textContent = `₹${monthlySalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // 1. Calculate Common Expenses
  const totalCommon = commonExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const leftAfterCommon = monthlySalary - totalCommon;
  const commonCount = commonExpenses.length;
  const pctLeft = monthlySalary > 0 ? ((leftAfterCommon / monthlySalary) * 100).toFixed(1) : '0';

  if (budgetCommonTotal) budgetCommonTotal.textContent = `-₹${totalCommon.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (budgetCommonCount) budgetCommonCount.textContent = `${commonCount} recurring bill${commonCount === 1 ? '' : 's'}`;
  if (tableTotalCommon) tableTotalCommon.textContent = `-₹${totalCommon.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Update Callouts and Scorecards for Common Expenses
  if (budgetLeftAfterCommon) {
    budgetLeftAfterCommon.textContent = `${leftAfterCommon >= 0 ? '₹' : '-₹'}${Math.abs(leftAfterCommon).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    budgetLeftAfterCommon.className = `ledger-value font-mono ${leftAfterCommon >= 0 ? 'text-blue' : 'text-red'}`;
  }
  if (budgetLeftAfterCommonPct) budgetLeftAfterCommonPct.textContent = `${pctLeft}% of salary free`;

  if (calloutLeftAfterCommon) {
    calloutLeftAfterCommon.textContent = `${leftAfterCommon >= 0 ? '₹' : '-₹'}${Math.abs(leftAfterCommon).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    calloutLeftAfterCommon.className = `font-mono highlight-money ${leftAfterCommon >= 0 ? 'text-green' : 'text-red'}`;
  }
  if (calloutSalaryDisp) calloutSalaryDisp.textContent = `₹${monthlySalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (calloutCommonDisp) calloutCommonDisp.textContent = `₹${totalCommon.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (emptyLeftMoneyDisp) emptyLeftMoneyDisp.textContent = `${leftAfterCommon >= 0 ? '₹' : '-₹'}${Math.abs(leftAfterCommon).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Render Common Expenses Table Rows
  if (commonExpensesTbody) {
    if (commonExpenses.length === 0) {
      commonExpensesTbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding: 24px; color: var(--ink-secondary);">
            No common monthly bills recorded yet. Tap <strong>+ Add Common Expense</strong> to list your recurring commitments.
          </td>
        </tr>
      `;
    } else {
      commonExpensesTbody.innerHTML = commonExpenses.map(item => `
        <tr>
          <td><strong>${escapeHTML(item.name)}</strong></td>
          <td><span class="paper-tag">${escapeHTML(item.category || 'Fixed')}</span></td>
          <td class="text-right font-mono text-red">-₹${Number(item.amount).toFixed(2)}</td>
          <td class="text-center">
            <button class="del-btn" title="Delete common bill" onclick="deleteCommonExpense('${item.id}')">🗑️</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // 2. Calculate Daily / Variable Expenses
  let totalVarExpense = 0;
  let totalVarIncome = 0;
  budgetTransactions.forEach(t => {
    if (t.type === 'expense') totalVarExpense += Number(t.amount || 0);
    else totalVarIncome += Number(t.amount || 0);
  });

  const finalNetLeft = leftAfterCommon - totalVarExpense + totalVarIncome;
  if (budgetTotalExpense) budgetTotalExpense.textContent = `-₹${totalVarExpense.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (budgetNetBalance) {
    budgetNetBalance.textContent = `${finalNetLeft >= 0 ? '₹' : '-₹'}${Math.abs(finalNetLeft).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    budgetNetBalance.className = `ledger-value font-mono ${finalNetLeft >= 0 ? 'text-green' : 'text-red'}`;
  }

  // Counts for filter pills
  if (bcountAll) bcountAll.textContent = budgetTransactions.length;
  if (bcountExpense) bcountExpense.textContent = budgetTransactions.filter(t => t.type === 'expense').length;
  if (bcountIncome) bcountIncome.textContent = budgetTransactions.filter(t => t.type === 'income').length;

  // 3. Compute Running "Money Left" for Daily Ledger Table
  // Sort oldest to newest to compute running balance from base leftAfterCommon
  const sortedChronological = [...budgetTransactions].sort((a, b) => {
    return (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || '');
  });

  let runningBalance = leftAfterCommon;
  const balanceMap = {};
  sortedChronological.forEach(t => {
    if (t.type === 'expense') {
      runningBalance -= Number(t.amount || 0);
    } else {
      runningBalance += Number(t.amount || 0);
    }
    balanceMap[t.id] = runningBalance;
  });

  // Filter for display
  const filtered = budgetTransactions.filter(t => {
    const matchesType = budgetFilter === 'all' || t.type === budgetFilter;
    const query = budgetSearch.trim().toLowerCase();
    const matchesSearch = !query || (
      t.title.toLowerCase().includes(query) ||
      (t.category && t.category.toLowerCase().includes(query))
    );
    return matchesType && matchesSearch;
  });

  if (budgetTransactions.length === 0) {
    if (budgetEmptyState) budgetEmptyState.style.display = 'flex';
    if (budgetNoResults) budgetNoResults.style.display = 'none';
    if (dailyLedgerTableWrapper) dailyLedgerTableWrapper.style.display = 'none';
    return;
  }

  if (filtered.length === 0) {
    if (budgetEmptyState) budgetEmptyState.style.display = 'none';
    if (budgetNoResults) budgetNoResults.style.display = 'flex';
    if (dailyLedgerTableWrapper) dailyLedgerTableWrapper.style.display = 'none';
    return;
  }

  if (budgetEmptyState) budgetEmptyState.style.display = 'none';
  if (budgetNoResults) budgetNoResults.style.display = 'none';
  if (dailyLedgerTableWrapper) dailyLedgerTableWrapper.style.display = 'block';

  if (dailyLedgerTbody) {
    dailyLedgerTbody.innerHTML = filtered.map(t => {
      const isInc = t.type === 'income';
      const sign = isInc ? '+' : '-';
      const amtColor = isInc ? 'text-green' : 'text-red';
      const moneyLeft = balanceMap[t.id] !== undefined ? balanceMap[t.id] : 0;
      const isPositive = moneyLeft >= 0;

      return `
        <tr>
          <td class="font-mono" style="font-size: 0.82rem; color: var(--ink-muted);">${t.date || 'Today'}</td>
          <td><strong>${escapeHTML(t.title)}</strong></td>
          <td><span class="paper-tag">${escapeHTML(t.category || 'General')}</span></td>
          <td class="text-right font-mono ${amtColor}"><strong>${sign}$${Number(t.amount).toFixed(2)}</strong></td>
          <td class="text-right">
            <span class="money-left-badge ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '$' : '-$'}${Math.abs(moneyLeft).toFixed(2)}
            </span>
          </td>
          <td class="text-center">
            <button class="del-btn" title="Delete expense" onclick="deleteTransaction('${t.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Save Salary Handler
if (saveSalaryBtn) {
  saveSalaryBtn.addEventListener('click', () => {
    const newSal = parseFloat(monthlySalaryInput.value);
    if (isNaN(newSal) || newSal < 0) {
      showToast('Please enter a valid salary amount');
      return;
    }
    monthlySalary = newSal;
    saveSalary();
    renderBudgetDealer();
    updateHubSummary();
    showToast(`Monthly salary updated to $${monthlySalary.toLocaleString()}! 💼`);
  });
}

// Common Expenses Modal & Handlers
function openCommonModal() {
  if (commonExpenseForm) commonExpenseForm.reset();
  if (commonExpenseModal) commonExpenseModal.classList.add('active');
  setTimeout(() => { if (commonNameInput) commonNameInput.focus(); }, 100);
}

function closeCommonModal() {
  if (commonExpenseModal) commonExpenseModal.classList.remove('active');
}

if (openAddCommonBtn) openAddCommonBtn.addEventListener('click', openCommonModal);
if (btnQuickAddCommon) btnQuickAddCommon.addEventListener('click', openCommonModal);
if (commonModalClose) commonModalClose.addEventListener('click', closeCommonModal);
if (commonModalCancel) commonModalCancel.addEventListener('click', closeCommonModal);

if (commonExpenseForm) {
  commonExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = commonNameInput.value.trim();
    const amount = parseFloat(commonAmountInput.value);
    if (!name || isNaN(amount) || amount <= 0) return;

    const newCommon = {
      id: 'c_' + Date.now(),
      name: name,
      category: commonCategoryInput.value,
      amount: amount
    };

    commonExpenses.push(newCommon);
    saveCommonExpenses();
    closeCommonModal();
    renderBudgetDealer();
    updateHubSummary();
    showToast('Common monthly bill added! 📅');
  });
}

window.deleteCommonExpense = function(id) {
  commonExpenses = commonExpenses.filter(item => item.id !== id);
  saveCommonExpenses();
  renderBudgetDealer();
  updateHubSummary();
  showToast('Common bill removed 🗑️');
};

// Daily Expense Modal & Handlers
function openBudgetModal() {
  if (budgetForm) budgetForm.reset();
  if (transDateInput) transDateInput.value = new Date().toISOString().split('T')[0];
  if (budgetModal) budgetModal.classList.add('active');
  setTimeout(() => { if (transTitleInput) transTitleInput.focus(); }, 100);
}

function closeBudgetModal() {
  if (budgetModal) budgetModal.classList.remove('active');
}

if (openAddTransBtn) openAddTransBtn.addEventListener('click', openBudgetModal);
if (btnQuickAddDaily) btnQuickAddDaily.addEventListener('click', openBudgetModal);
if (emptyAddTransBtn) emptyAddTransBtn.addEventListener('click', openBudgetModal);
if (budgetModalClose) budgetModalClose.addEventListener('click', closeBudgetModal);
if (budgetModalCancel) budgetModalCancel.addEventListener('click', closeBudgetModal);

if (budgetForm) {
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = transTitleInput.value.trim();
    const amount = parseFloat(transAmountInput.value);
    if (!title || isNaN(amount) || amount <= 0) return;

    const newEntry = {
      id: 'trans_' + Date.now(),
      title: title,
      type: transTypeInput.value,
      amount: amount,
      category: transCategoryInput.value,
      date: transDateInput.value
    };

    budgetTransactions.unshift(newEntry);
    saveBudget();
    closeBudgetModal();
    renderBudgetDealer();
    updateHubSummary();
    showToast('Expense logged! Money left updated 🧾');
  });
}

window.deleteTransaction = function(id) {
  budgetTransactions = budgetTransactions.filter(t => t.id !== id);
  saveBudget();
  renderBudgetDealer();
  updateHubSummary();
  showToast('Transaction removed 🧾');
};

// Budget Search & Filter
if (budgetSearchInput) {
  budgetSearchInput.addEventListener('input', (e) => {
    budgetSearch = e.target.value;
    if (budgetSearchClear) budgetSearchClear.classList.toggle('visible', budgetSearch.length > 0);
    renderBudgetDealer();
  });
}

if (budgetSearchClear) {
  budgetSearchClear.addEventListener('click', () => {
    if (budgetSearchInput) {
      budgetSearchInput.value = '';
      budgetSearchInput.focus();
    }
    budgetSearch = '';
    budgetSearchClear.classList.remove('visible');
    renderBudgetDealer();
  });
}

if (budgetResetSearchBtn) {
  budgetResetSearchBtn.addEventListener('click', () => {
    if (budgetSearchInput) budgetSearchInput.value = '';
    budgetSearch = '';
    if (budgetSearchClear) budgetSearchClear.classList.remove('visible');
    budgetFilter = 'all';
    budgetFilterChips.forEach(c => c.classList.toggle('active', c.dataset.bfilter === 'all'));
    renderBudgetDealer();
  });
}

budgetFilterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    budgetFilterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    budgetFilter = chip.dataset.bfilter;
    renderBudgetDealer();
  });
});


// ========================================================
// 3. DIET HELPER MODULE (MEALS, CALORIES, WATER)
// ========================================================
function renderDietHelper() {
  const totalCalories = dietMeals.reduce((acc, m) => acc + Number(m.calories || 0), 0);
  const targetCalories = 2000;
  totalCaloriesNum.textContent = totalCalories;

  const pct = Math.min(Math.round((totalCalories / targetCalories) * 100), 100);
  calorieProgressBar.style.width = `${pct}%`;

  const remaining = targetCalories - totalCalories;
  calorieRemainingNote.textContent = remaining >= 0
    ? `${remaining} kcal remaining to reach goal`
    : `${Math.abs(remaining)} kcal over daily goal`;

  // Hydration visual
  waterCountNum.textContent = waterGlasses;
  let droplets = '';
  for (let i = 0; i < 8; i++) {
    droplets += (i < waterGlasses) ? '💧 ' : '⚪ ';
  }
  glassesVisualIcons.textContent = droplets.trim();

  // Counts
  dcountAll.textContent = dietMeals.length;

  // Filter
  const filtered = dietMeals.filter(m => {
    const matchesType = dietFilter === 'all' || m.mealType === dietFilter;
    const query = dietSearch.trim().toLowerCase();
    const matchesSearch = !query || (
      m.name.toLowerCase().includes(query) ||
      (m.notes && m.notes.toLowerCase().includes(query)) ||
      (m.mealType && m.mealType.toLowerCase().includes(query))
    );
    return matchesType && matchesSearch;
  });

  if (dietMeals.length === 0) {
    dietEmptyState.style.display = 'flex';
    dietNoResults.style.display = 'none';
    dietMealsListEl.style.display = 'none';
    return;
  }

  if (filtered.length === 0) {
    dietEmptyState.style.display = 'none';
    dietNoResults.style.display = 'flex';
    dietMealsListEl.style.display = 'none';
    return;
  }

  dietEmptyState.style.display = 'none';
  dietNoResults.style.display = 'none';
  dietMealsListEl.style.display = 'flex';

  const mealIcons = {
    'Breakfast': '🍳',
    'Lunch': '🥪',
    'Dinner': '🍲',
    'Snack': '🍎'
  };

  dietMealsListEl.innerHTML = filtered.map(m => {
    const icon = mealIcons[m.mealType] || '🍽️';
    return `
      <li class="meal-row">
        <div class="meal-left">
          <span class="meal-icon-tag">${icon}</span>
          <div>
            <div class="meal-title-text">${escapeHTML(m.name)}</div>
            ${m.notes ? `<div class="meal-notes-text">${escapeHTML(m.notes)}</div>` : ''}
            <span class="meal-meta-pill">${m.mealType}</span>
          </div>
        </div>
        <div class="meal-right">
          <span class="meal-cal-val font-mono">${m.calories} kcal</span>
          <button class="del-btn" title="Delete meal" onclick="deleteMeal('${m.id}')">🗑️</button>
        </div>
      </li>
    `;
  }).join('');
}

window.deleteMeal = function(id) {
  dietMeals = dietMeals.filter(m => m.id !== id);
  saveDietMeals();
  renderDietHelper();
  updateHubSummary();
  showToast('Meal removed 🍎');
};

// Water Stepper
waterPlusBtn.addEventListener('click', () => {
  waterGlasses++;
  saveDietWater();
  renderDietHelper();
  showToast(`Hydrated! ${waterGlasses} glasses 💧`);
});

waterMinusBtn.addEventListener('click', () => {
  if (waterGlasses > 0) {
    waterGlasses--;
    saveDietWater();
    renderDietHelper();
  }
});

// Diet Search & Filter
dietSearchInput.addEventListener('input', (e) => {
  dietSearch = e.target.value;
  dietSearchClear.classList.toggle('visible', dietSearch.length > 0);
  renderDietHelper();
});

dietSearchClear.addEventListener('click', () => {
  dietSearchInput.value = '';
  dietSearch = '';
  dietSearchClear.classList.remove('visible');
  dietSearchInput.focus();
  renderDietHelper();
});

dietResetSearchBtn.addEventListener('click', () => {
  dietSearchInput.value = '';
  dietSearch = '';
  dietSearchClear.classList.remove('visible');
  dietFilter = 'all';
  dietFilterChips.forEach(c => c.classList.toggle('active', c.dataset.dfilter === 'all'));
  renderDietHelper();
});

dietFilterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    dietFilterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    dietFilter = chip.dataset.dfilter;
    renderDietHelper();
  });
});

// Diet Modal
function openDietModal() {
  dietForm.reset();
  dietModal.classList.add('active');
  setTimeout(() => mealNameInput.focus(), 100);
}

function closeDietModal() {
  dietModal.classList.remove('active');
}

dietForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = mealNameInput.value.trim();
  const cal = parseInt(mealCalInput.value, 10);
  if (!name || isNaN(cal)) return;

  const newMeal = {
    id: 'meal_' + Date.now(),
    name: name,
    mealType: mealTypeInput.value,
    calories: cal,
    notes: mealNotesInput.value.trim(),
    date: new Date().toISOString()
  };

  dietMeals.unshift(newMeal);
  saveDietMeals();
  closeDietModal();
  renderDietHelper();
  updateHubSummary();
  showToast('Meal logged in journal! 🥗');
});


// ==========================================
// GENERAL EVENT LISTENERS & SHORTCUTS
// ==========================================
function setupEventListeners() {
  // Task triggers
  if (openAddTaskBtn) openAddTaskBtn.addEventListener('click', openTaskModal);
  if (emptyAddTaskBtn) emptyAddTaskBtn.addEventListener('click', openTaskModal);
  if (taskModalClose) taskModalClose.addEventListener('click', closeTaskModal);
  if (taskModalCancel) taskModalCancel.addEventListener('click', closeTaskModal);

  // Diet triggers
  if (openLogMealBtn) openLogMealBtn.addEventListener('click', openDietModal);
  if (emptyAddMealBtn) emptyAddMealBtn.addEventListener('click', openDietModal);
  if (dietModalClose) dietModalClose.addEventListener('click', closeDietModal);
  if (dietModalCancel) dietModalCancel.addEventListener('click', closeDietModal);

  // Backdrop modal dismiss for all dialogs
  const allModals = [taskModal, budgetModal, commonExpenseModal, dietModal].filter(Boolean);
  allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(m => m.classList.remove('active'));
    }
  });
}

// ==========================================
// UTILITY: PAPER TOAST & ESCAPING
// ==========================================
let toastTimer;
function showToast(text) {
  paperToastEl.textContent = text;
  paperToastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    paperToastEl.classList.remove('show');
  }, 2400);
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Boot on DOM loaded
document.addEventListener('DOMContentLoaded', initApp);
