import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, doc, setDoc, getDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
    const tabLoginBtn = document.getElementById("tab-login-btn");
    const tabRegBtn = document.getElementById("tab-reg-btn");
    const tabHrBtn = document.getElementById("tab-hr-btn");
    const loginForm = document.getElementById("login-form");
    const regForm = document.getElementById("register-form");
    const hrLoginForm = document.getElementById("hr-login-form");
    const clockDisplay = document.getElementById("clock-display");
    const btnLogout = document.getElementById("btn-logout");

    // ฟังก์ชันแสดง Pop-up แจ้งเตือนแบบ Custom
    function showAlert(message) {
        const modal = document.getElementById("custom-modal");
        const msgEl = document.getElementById("modal-msg");
        const closeBtn = document.getElementById("modal-close-btn");

        if (modal && msgEl && closeBtn) {
            msgEl.textContent = message;
            modal.style.display = "flex";
            closeBtn.onclick = () => {
                modal.style.display = "none";
            };
        } else {
            alert(message);
        }
    }

    // สลับแท็บหน้าแรก
    if (tabLoginBtn && tabRegBtn && tabHrBtn) {
        tabLoginBtn.addEventListener("click", () => {
            if (loginForm) loginForm.style.display = "block";
            if (regForm) regForm.style.display = "none";
            if (hrLoginForm) hrLoginForm.style.display = "none";
            tabLoginBtn.style.background = "#5c6bc0"; tabLoginBtn.style.color = "white";
            tabRegBtn.style.background = "#e0e0e0"; tabRegBtn.style.color = "#424242";
            tabHrBtn.style.background = "#e0e0e0"; tabHrBtn.style.color = "#424242";
        });
        tabRegBtn.addEventListener("click", () => {
            if (loginForm) loginForm.style.display = "none";
            if (regForm) regForm.style.display = "block";
            if (hrLoginForm) hrLoginForm.style.display = "none";
            tabRegBtn.style.background = "#26a69a"; tabRegBtn.style.color = "white";
            tabLoginBtn.style.background = "#e0e0e0"; tabLoginBtn.style.color = "#424242";
            tabHrBtn.style.background = "#e0e0e0"; tabHrBtn.style.color = "#424242";
        });
        tabHrBtn.addEventListener("click", () => {
            if (loginForm) loginForm.style.display = "none";
            if (regForm) regForm.style.display = "none";
            if (hrLoginForm) hrLoginForm.style.display = "block";
            tabHrBtn.style.background = "#f57c00"; tabHrBtn.style.color = "white";
            tabLoginBtn.style.background = "#e0e0e0"; tabLoginBtn.style.color = "#424242";
            tabRegBtn.style.background = "#e0e0e0"; tabRegBtn.style.color = "#424242";
        });
    }

    if (clockDisplay) {
        setInterval(() => {
            clockDisplay.textContent = `เวลาปัจจุบัน: ${new Date().toLocaleTimeString("th-TH")}`;
        }, 1000);
    }

    // 1. ลืมรหัสผ่าน
    const btnForgotPassword = document.getElementById("btn-forgot-password");
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener("click", async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("login-email").value.trim().toLowerCase();

            if (!emailInput) {
                showAlert("⚠️ กรุณากรอกอีเมลในช่องอีเมลก่อน แล้วกด 'ลืมรหัสผ่าน?' อีกครั้ง");
                return;
            }

            const isValidDomain = emailInput.endsWith("@internchubb.com") || emailInput.endsWith("@hrchubb.com");
            const isDemoEmail = emailInput === "fromwadwada@gmail.com";

            if (!isValidDomain && !isDemoEmail) {
                showAlert("⚠️ อีเมลต้องลงท้ายด้วย @internchubb.com หรือใช้อีเมลสาธิตเพื่อทดสอบ");
                return;
            }

            try {
                await sendPasswordResetEmail(auth, emailInput);
                showAlert(`📧 ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล:\n${emailInput}\n\nกรุณาเช็กในกล่องข้อความหรืออีเมลขยะ`);
            } catch (err) {
                showAlert("⚠️ ไม่สามารถส่งอีเมลได้: " + err.message);
            }
        });
    }

    // 2. ลงทะเบียนนักศึกษาใหม่
    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("reg-email").value.trim().toLowerCase();
            const password = document.getElementById("reg-password").value;
            const firstName = document.getElementById("reg-firstname").value.trim();
            const lastName = document.getElementById("reg-lastname").value.trim();
            const nickname = document.getElementById("reg-nickname").value.trim();
            const department = document.getElementById("reg-dept").value.trim();
            const targetHours = parseFloat(document.getElementById("reg-target").value) || 560;

            const isDemoEmail = email === "fromwadwada@gmail.com";
            if (!email.endsWith("@internchubb.com") && !isDemoEmail) {
                showAlert("⚠️ นักศึกษาต้องใช้อีเมลลงท้ายด้วย @internchubb.com เท่านั้น");
                return;
            }

            if (password.length < 6) {
                showAlert("⚠️ รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไป");
                return;
            }

            try {
                await signOut(auth);
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                
                await setDoc(doc(db, "users", cred.user.uid), {
                    uid: cred.user.uid,
                    email: email,
                    role: "student",
                    firstName: firstName,
                    lastName: lastName,
                    nickname: nickname,
                    department: department,
                    targetHours: targetHours,
                    createdAt: serverTimestamp()
                });
                
                showAlert("✅ ลงทะเบียนเข้าสารบบเรียบร้อย!");
                window.location.href = "dashboard.html";
            } catch (err) {
                showAlert("⚠️ ลงทะเบียนไม่สำเร็จ: " + err.message);
            }
        });
    }

    // 3. เข้าสู่ระบบนักศึกษา
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim().toLowerCase();
            const password = document.getElementById("login-password").value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "dashboard.html";
            } catch (err) {
                showAlert("⚠️ อีเมลหรือรหัสผ่านไม่ถูกต้อง");
            }
        });
    }

    // 4. เข้าสู่ระบบ HR (@hrchubb.com)
    if (hrLoginForm) {
        hrLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("hr-email").value.trim().toLowerCase();
            const password = document.getElementById("hr-password").value;

            if (!email.endsWith("@hrchubb.com")) {
                showAlert("⚠️ สิทธิ์ HR ต้องใช้อีเมลลงท้ายด้วย @hrchubb.com เท่านั้น");
                return;
            }

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "hr.html";
            } catch (err) {
                if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
                    const createNew = confirm("⚠️ ไม่พบบัญชี HR นี้ คุณต้องการสร้างบัญชีใหม่ด้วยอีเมลและรหัสผ่านนี้หรือไม่?");
                    if (createNew) {
                        try {
                            const cred = await createUserWithEmailAndPassword(auth, email, password);
                            await setDoc(doc(db, "users", cred.user.uid), {
                                uid: cred.user.uid,
                                email: email,
                                role: "hr",
                                firstName: "HR",
                                lastName: "Admin",
                                nickname: "HR",
                                department: "Human Resources"
                            });
                            showAlert("✅ สร้างบัญชี HR สำเร็จ!");
                            window.location.href = "hr.html";
                        } catch (createErr) {
                            showAlert("⚠️ ไม่สามารถสร้างบัญชี HR ได้: " + createErr.message);
                        }
                    }
                } else {
                    showAlert("⚠️ เข้าสู่ระบบไม่สำเร็จ: " + err.message);
                }
            }
        });
    }

    // 5. เช็ก Auth State & สิทธิ์การเข้าถึง
    onAuthStateChanged(auth, async (user) => {
        const path = window.location.pathname;

        if (user) {
            const isHR = user.email && user.email.toLowerCase().endsWith("@hrchubb.com");

            if (path.includes("hr.html") && !isHR) {
                showAlert("⛔ บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า HR");
                window.location.href = "dashboard.html";
                return;
            }

            if (path.includes("index.html") || path.endsWith("/")) {
                window.location.href = isHR ? "hr.html" : "dashboard.html";
                return;
            }

            if (document.getElementById("user-fullname")) loadStudentData(user);
            if (document.getElementById("hr-table-body")) loadHRDataAllUsers();
        } else {
            if (path.includes("dashboard.html") || path.includes("hr.html")) {
                window.location.href = "index.html";
            }
        }
    });

    // 6. โหลดโปรไฟล์นักศึกษา (Dashboard)
    async function loadStudentData(user) {
        const fullnameEl = document.getElementById("user-fullname");
        const deptEl = document.getElementById("user-dept-nickname");

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let targetHours = 560;

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const nameStr = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                const nickStr = userData.nickname ? `(${userData.nickname})` : '';
                
                if (fullnameEl) fullnameEl.textContent = `${nameStr} ${nickStr}`.trim() || user.email;
                if (deptEl) deptEl.textContent = `แผนก: ${userData.department || 'นักศึกษาฝึกงาน'}`;
                targetHours = userData.targetHours || 560;
            } else {
                if (fullnameEl) fullnameEl.textContent = user.email;
                if (deptEl) deptEl.textContent = "แผนก: นักศึกษาฝึกงาน";
            }

            const q = query(collection(db, "attendances"), orderBy("timestamp", "desc"));
            onSnapshot(q, (snapshot) => {
                let totalAcc = 0;
                const tbody = document.getElementById("student-log-table");
                if (!tbody) return;
                
                tbody.innerHTML = "";
                let count = 0;

                snapshot.forEach((docSnap) => {
                    const item = docSnap.data();
                    if (item.uid === user.uid) {
                        count++;
                        totalAcc += item.hoursNum || 0;

                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${item.dateStr || '-'}<br><small style="color:#777;">เข้า: ${item.checkInTime || '-'} | ออก: ${item.checkOutTime || '-'}</small></td>
                            <td><b style="color:#2e7d32;">+${item.hoursDisplay || item.hoursNum || 0} ชม.</b></td>
                            <td><span class="status-badge">${item.status || 'ปกติ'}</span></td>
                        `;
                        tbody.appendChild(tr);
                    }
                });

                if (count === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">ยังไม่มีประวัติการลงเวลา</td></tr>`;
                }

                const remaining = Math.max(0, targetHours - totalAcc);
                const percent = Math.min(100, Math.round((totalAcc / targetHours) * 100));

                const statAcc = document.getElementById("stat-accumulated");
                const statRem = document.getElementById("stat-remaining");
                const progFill = document.getElementById("progress-fill");
                const progPercent = document.getElementById("progress-percent");

                if (statAcc) statAcc.textContent = totalAcc.toFixed(2).replace(".00", "");
                if (statRem) statRem.textContent = remaining.toFixed(2).replace(".00", "");
                if (progFill) progFill.style.width = `${percent}%`;
                if (progPercent) progPercent.textContent = `${percent}% ความคืบหน้า`;
            });
        } catch (err) {
            console.error(err);
        }
    }

    // 7. Check-In
    const btnCheckin = document.getElementById("btn-checkin");
    if (btnCheckin) {
        btnCheckin.addEventListener("click", () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });
            const hoursNum = now.getHours();
            const minsNum = now.getMinutes();

            let reason = "-";

            if (hoursNum > 8 || (hoursNum === 8 && minsNum > 30)) {
                const userReason = prompt("⚠️ คุณเข้างานหลัง 08:30 น. กรุณาระบุเหตุผลการมาสาย:");
                if (userReason !== null && userReason.trim() !== "") {
                    reason = userReason.trim();
                } else {
                    showAlert("⚠️ กรุณาระบุเหตุผลการมาสายเพื่อบันทึกเวลา");
                    return;
                }
            }

            sessionStorage.setItem("checkin_data", JSON.stringify({
                hour: hoursNum,
                minute: minsNum,
                timeStr: timeStr,
                reason: reason
            }));
            
            showAlert(`🟢 บันทึกเวลาเข้างานเรียบร้อย: ${timeStr}\nอย่าลืมกด Check-Out ตอนเลิกงาน`);
        });
    }

    // 8. Check-Out
    const btnCheckout = document.getElementById("btn-checkout");
    if (btnCheckout) {
        btnCheckout.addEventListener("click", async () => {
            const checkinRaw = sessionStorage.getItem("checkin_data");
            if (!checkinRaw) {
                showAlert("⚠️ คุณยังไม่ได้กด Check-In สำหรับวันนี้");
                return;
            }

            const checkinData = JSON.parse(checkinRaw);
            const user = auth.currentUser;
            const now = new Date();
            const checkOutStr = now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });

            let displayName = "นักศึกษา";
            let deptName = "-";

            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const full = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    const nick = userData.nickname ? `(${userData.nickname})` : '';
                    displayName = full ? `${full} ${nick}`.trim() : (userData.nickname || user.email);
                    deptName = userData.department || '-';
                } else {
                    displayName = user.email;
                }
            }

            let hoursNum = 0;
            let hoursDisplay = "";
            let statusText = "";

            if (checkinData.hour < 10 || (checkinData.hour === 10 && checkinData.minute === 0)) {
                hoursNum = 8;
                hoursDisplay = "8";
                statusText = checkinData.reason !== "-" ? "มาสาย มีเหตุผล" : "ปกติ";
            } else {
                hoursNum = 5.5;
                hoursDisplay = "5.30";
                statusText = "สายหลัง 10:00 น.";
            }

            await addDoc(collection(db, "attendances"), {
                uid: user ? user.uid : "guest",
                studentName: displayName,
                department: deptName,
                checkInTime: checkinData.timeStr,
                checkOutTime: checkOutStr,
                hoursNum: hoursNum,
                hoursDisplay: hoursDisplay,
                status: statusText,
                reason: checkinData.reason,
                timestamp: serverTimestamp(),
                dateStr: now.toLocaleDateString("th-TH")
            });

            sessionStorage.removeItem("checkin_data");
            showAlert(`🔴 บันทึกออกงานเรียบร้อย!\nคุณได้รับชั่วโมงสะสมเพิ่ม: +${hoursDisplay} ชั่วโมง`);
        });
    }

    // 9. HR Data All Users & Real-time Search
    let allStudentsAndLogs = [];

    async function loadHRDataAllUsers() {
        const searchInput = document.getElementById("search-input");

        const attendanceQuery = query(collection(db, "attendances"), orderBy("timestamp", "desc"));
        onSnapshot(attendanceQuery, async (attSnapshot) => {
            let logsList = [];
            attSnapshot.forEach(docSnap => logsList.push(docSnap.data()));

            const usersQuery = query(collection(db, "users"));
            onSnapshot(usersQuery, (userSnapshot) => {
                allStudentsAndLogs = [];
                const userMap = new Map();

                userSnapshot.forEach(uSnap => {
                    const uData = uSnap.data();
                    if (!uData.email || !uData.email.endsWith("@hrchubb.com")) {
                        userMap.set(uData.uid, uData);
                    }
                });

                userMap.forEach((uData, uid) => {
                    const userLogs = logsList.filter(log => log.uid === uid);
                    const totalHours = userLogs.reduce((sum, item) => sum + (item.hoursNum || 0), 0);
                    const lastLog = userLogs[0] || {};

                    const fn = uData.firstName || "";
                    const ln = uData.lastName || "";
                    const nn = uData.nickname || "";
                    const em = uData.email || "";

                    let displayName = `${fn} ${ln} ${nn ? '(' + nn + ')' : ''}`.trim();
                    if (!displayName) displayName = em || "นักศึกษา";

                    allStudentsAndLogs.push({
                        uid: uid,
                        firstName: fn,
                        lastName: ln,
                        nickname: nn,
                        email: em,
                        department: uData.department || lastLog.department || "-",
                        fullNameDisplay: displayName,
                        totalHoursDisplay: totalHours > 0 ? totalHours.toFixed(2).replace(".00", "") : "0",
                        lastCheckIn: lastLog.checkInTime || "-",
                        lastCheckOut: lastLog.checkOutTime || "-",
                        lastDate: lastLog.dateStr || "-",
                        lastReason: lastLog.reason || "-",
                        lastStatus: lastLog.status || "ยังไม่มีประวัติลงเวลา"
                    });
                });

                logsList.forEach(log => {
                    if (log.uid && !userMap.has(log.uid)) {
                        const exists = allStudentsAndLogs.some(item => item.uid === log.uid);
                        if (!exists) {
                            const userLogs = logsList.filter(l => l.uid === log.uid);
                            const totalHours = userLogs.reduce((sum, item) => sum + (item.hoursNum || 0), 0);
                            
                            let fallbackName = log.studentName;
                            if (!fallbackName || fallbackName === "0" || fallbackName === 0) fallbackName = log.uid;

                            allStudentsAndLogs.push({
                                uid: log.uid,
                                firstName: "",
                                lastName: "",
                                nickname: log.reason && log.reason !== "-" ? log.reason : "",
                                email: fallbackName,
                                department: log.department || "-",
                                fullNameDisplay: fallbackName,
                                totalHoursDisplay: totalHours > 0 ? totalHours.toFixed(2).replace(".00", "") : "0",
                                lastCheckIn: log.checkInTime || "-",
                                lastCheckOut: log.checkOutTime || "-",
                                lastDate: log.dateStr || "-",
                                lastReason: log.reason || "-",
                                lastStatus: log.status || "ปกติ"
                            });
                        }
                    }
                });

                renderHRTable(allStudentsAndLogs);
            });
        });

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                const filtered = allStudentsAndLogs.filter(item => {
                    const full = String(item.fullNameDisplay).toLowerCase();
                    const fn = String(item.firstName).toLowerCase();
                    const ln = String(item.lastName).toLowerCase();
                    const nn = String(item.nickname).toLowerCase();
                    const em = String(item.email).toLowerCase();
                    const dept = String(item.department).toLowerCase();
                    const reason = String(item.lastReason).toLowerCase();

                    return full.includes(keyword) || 
                           fn.includes(keyword) || 
                           ln.includes(keyword) || 
                           nn.includes(keyword) || 
                           em.includes(keyword) || 
                           dept.includes(keyword) ||
                           reason.includes(keyword);
                });
                renderHRTable(filtered);
            });
        }
    }

    function renderHRTable(students) {
        const tbody = document.getElementById("hr-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:15px; color:#999;">ไม่พบรายชื่อหรือคำค้นหานี้ในระบบ</td></tr>`;
            return;
        }

        students.forEach(item => {
            const tr = document.createElement("tr");
            tr.style.borderBottom = "1px solid #eee";
            tr.innerHTML = `
                <td style="padding:10px;"><b>${item.fullNameDisplay}</b><br><small style="color:#888;">${item.email}</small></td>
                <td style="padding:10px;">${item.department}</td>
                <td style="padding:10px;">${item.lastDate}</td>
                <td style="padding:10px;">เข้า: ${item.lastCheckIn}<br>ออก: ${item.lastCheckOut}</td>
                <td style="padding:10px;">${item.lastReason}</td>
                <td style="padding:10px;"><b style="color:#2e7d32;">${item.totalHoursDisplay} ชม.</b></td>
                <td style="padding:10px;"><span class="status-badge">${item.lastStatus}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 10. Export CSV
    const btnExport = document.getElementById("btn-export");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            let csv = "\uFEFFFirst Name,Last Name,Nickname,Email,Department,Last Date,Last CheckIn,Last CheckOut,Last Reason,Total Accumulated Hours,Status\n";
            allStudentsAndLogs.forEach(item => {
                csv += `"${item.firstName}","${item.lastName}","${item.nickname}","${item.email}","${item.department}","${item.lastDate}","${item.lastCheckIn}","${item.lastCheckOut}","${item.lastReason}","${item.totalHoursDisplay}","${item.lastStatus}"\n`;
            });
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `HR_Student_Report_${new Date().toLocaleDateString("th-TH")}.csv`;
            link.click();
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            signOut(auth).then(() => {
                window.location.href = "index.html";
            });
        });
    }
});