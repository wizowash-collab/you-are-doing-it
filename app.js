const firebaseConfig = {
  apiKey: "AIzaSyBE05A_ZUC2SxJGt0elkMPuOhe3vseYklU",
  authDomain: "you-are-doing-it.firebaseapp.com",
  projectId: "you-are-doing-it",
  storageBucket: "you-are-doing-it.firebasestorage.app",
  messagingSenderId: "480864077002",
  appId: "1:480864077002:web:b90db241d09e9bbf222033",
  measurementId: "G-KG1DQK3LB3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;
const today = new Date().toISOString().split("T")[0];

// ✅ Sign in anonymously and start app
auth.signInAnonymously()
  .then(() => {
    currentUser = auth.currentUser;
    showDailyQuote();
    loadGoals();
    document.getElementById("goalInput").focus();
  })
  .catch(error => {
    console.error("Authentication error:", error);
  });

// ✅ Style dropdown based on value
function styleStatusDropdown(select) {
  const value = parseInt(select.value);
  select.style.backgroundColor = "";
  select.style.color = "";

  if (value === 0) {
    select.style.backgroundColor = "#e74c3c";
    select.style.color = "white";
  } else if (value === 50) {
    select.style.backgroundColor = "#f1c40f";
    select.style.color = "black";
  } else if (value === 100) {
    select.style.backgroundColor = "#2ecc71";
    select.style.color = "black";
  }
}

function addGoal() {
  const input = document.getElementById("goalInput");
  const goalText = input.value.trim();
  if (!goalText || !currentUser) return;

  db.collection("goals").add({
    userId: currentUser.uid,
    text: goalText,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    input.value = "";
  }).catch(error => {
    console.error("Error adding goal:", error);
  });
}

function loadGoals() {
  const tableBody = document.getElementById("goalRows");
  if (!currentUser) return;

  db.collection("goals")
    .where("userId", "==", currentUser.uid)
    .orderBy("createdAt")
    .onSnapshot(snapshot => {
      tableBody.innerHTML = "";

      if (snapshot.empty) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.textContent = "No goals yet. Add one to begin your journey!";
        td.style.textAlign = "center";
        td.style.color = "#888";
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
      }

      snapshot.forEach(doc => {
        const goal = doc.data();
        const goalId = doc.id;

        const tr = document.createElement("tr");

        const tdGoal = document.createElement("td");
        tdGoal.textContent = goal.text;

        const tdStatus = document.createElement("td");
        const select = document.createElement("select");
        [0, 50, 100].forEach(val => {
          const option = document.createElement("option");
          option.value = val;
          option.textContent = `${val}%`;
          select.appendChild(option);
        });
        styleStatusDropdown(select);

        select.onchange = () => {
          styleStatusDropdown(select);
          saveDailyEntry(goalId, select.value, noteInput.value);
        };
        tdStatus.appendChild(select);

        const tdNote = document.createElement("td");
        const noteInput = document.createElement("textarea");
        noteInput.rows = 2;
        noteInput.placeholder = "Add note...";
        noteInput.onblur = () => {
          saveDailyEntry(goalId, select.value, noteInput.value);
        };
        tdNote.appendChild(noteInput);

        tr.appendChild(tdGoal);
        tr.appendChild(tdStatus);
        tr.appendChild(tdNote);
        tableBody.appendChild(tr);

        db.collection("dailyEntries")
          .where("userId", "==", currentUser.uid)
          .where("goalId", "==", goalId)
          .where("date", "==", today)
          .get()
          .then(querySnapshot => {
            querySnapshot.forEach(entryDoc => {
              const entry = entryDoc.data();
              select.value = entry.progress;
              noteInput.value = entry.note;
              styleStatusDropdown(select);
            });
          });
      });
    });
}

function saveDailyEntry(goalId, progress, note) {
  if (!currentUser) return;

  const entryRef = db.collection("dailyEntries")
    .where("userId", "==", currentUser.uid)
    .where("goalId", "==", goalId)
    .where("date", "==", today);

  entryRef.get().then(snapshot => {
    if (snapshot.empty) {
      db.collection("dailyEntries").add({
        userId: currentUser.uid,
        goalId,
        date: today,
        progress: parseInt(progress),
        note
      });
    } else {
      snapshot.forEach(doc => {
        doc.ref.update({
          progress: parseInt(progress),
          note
        });
      });
    }
  });
}

function showDailyQuote() {
  const quote = "New day, fresh start. You are capable of amazing things.";
  document.getElementById("dailyQuote").textContent = quote;

  const date = new Date();
  const options = { month: "long", day: "numeric", year: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);
  document.getElementById("todayDate").textContent = `Today is ${formattedDate}`;
}