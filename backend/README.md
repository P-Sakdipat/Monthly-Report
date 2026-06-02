# 🚀 Exc Dashboard Backend API (Node.js + Express + TypeScript)

ระบบหลังบ้านคุณภาพสูงและปลอดภัย พัฒนาด้วย **Node.js**, **Express** และ **TypeScript** เชื่อมต่อกับระบบฐานข้อมูล **MS SQL Server** ของคุณ เพื่อทำระบบ Login และเป็นตัวกลางในการส่งข้อมูล API ให้กับทีมหน้าบ้าน **React / Next.js** นำไปใช้งานได้อย่างรวดเร็ว

---

## 🛠️ วิธีการติดตั้งและเริ่มใช้งานหลังบ้าน (Setup Guide)

### 1. ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์ `backend/` แล้วพิมพ์คำสั่ง:
```bash
npm install
```

### 2. ตั้งค่าไฟล์ Environment Variables (`.env`)
เราได้สร้างไฟล์ `.env` ไว้ที่รากโฟลเดอร์หลังบ้านเรียบร้อยแล้ว หากต้องการปรับเปลี่ยน ให้เข้าไปแก้ไขค่าในไฟล์ได้โดยตรง:
```env
PORT=5000
DB_SERVER=xx.yyy.zz.xyz
DB_USER=root
DB_PASSWORD=1234
DB_DATABASE=MD_monthly
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=dashboard_super_secret_key_2026_change_me
JWT_EXPIRES_IN=24h
```

### 3. รัน Server ในโหมด Development (Hot Reloading)
รันเซิร์ฟเวอร์โดยจะคอยรีสตาร์ทอัตโนมัติเมื่อมีการแก้ไขโค้ด:
```bash
npm run dev
```

### 4. รัน Server สำหรับ Production
บิลด์โค้ด TypeScript เป็น JavaScript และสั่งรันเซิร์ฟเวอร์แบบ Production:
```bash
npm run build
npm start
```

---

## 📖 เอกสารคู่มือ API (Interactive Swagger Documentation)

ระบบหลังบ้านชุดนี้มาพร้อมกับ **Swagger UI** ในตัว ช่วยให้ทีมหน้าบ้านสามารถกดทดลองเล่นและดูสเปกของ API ได้ทันทีผ่านเบราว์เซอร์:

👉 **URL เอกสารคู่มือ:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## 💻 คู่มือการดึง API สำหรับทีมหน้าบ้าน (Next.js / React Integration Guide)

ทีม Frontend (React / Next.js) สามารถคัดลอกตัวอย่างโค้ดด้านล่างนี้ไปปรับใช้ในการดึงข้อมูลเข้าระบบหลังบ้านได้ทันที:

### 1. โค้ดส่งข้อมูลเพื่อเข้าสู่ระบบ (Login Request)
ตัวอย่างการเรียกใช้ API ใน React คอมโพเนนต์สำหรับหน้า Login:

```javascript
// services/auth.js หรือทำใน component หน้า Login
export const loginUser = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      // 1. เก็บ JWT Token ลงใน localStorage หรือ Cookies
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login สำเร็จ:', data.message);
      return { success: true, user: data.user };
    } else {
      console.error('Login ล้มเหลว:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ API:', error);
    return { success: false, error: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
  }
};
```

### 2. โค้ดดึงข้อมูลโปรไฟล์ผู้ใช้งานที่ Login อยู่ (Profile Request)
ในการดึงข้อมูลหน้าบ้านหรือเช็คสถานะการเข้าสู่ระบบผ่าน Route ที่มีการป้องกันความปลอดภัย:

```javascript
// services/auth.js หรือฟังก์ชันสำหรับดึงข้อมูล
export const getMyProfile = async () => {
  // ดึง token ออกมาจาก localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { success: false, error: 'ไม่มี Token สำหรับการยืนยันตัวตน' };
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // ส่ง Bearer Token ไปใน Authorization Header เพื่อยืนยันสิทธิ์ความปลอดภัย
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      return { success: true, user: data.user };
    } else {
      // หากโทเค็นหมดอายุหรือผิดพลาด ให้ล้างค่าที่เซฟออก
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์:', error);
    return { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
  }
};
```

### 3. ตัวอย่างการสร้าง Axios Client (แนะนำเพื่อลดความซ้ำซ้อน)
หากทีมหน้าบ้านใช้ `axios` สามารถตั้งค่า instance เพื่อแนบ Token อัตโนมัติในทุกๆ Request ได้ดังนี้:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// แนบ Token อัตโนมัติในทุก Request (ถ้ามี)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

// เรียกใช้สั้นๆ ง่ายๆ ดังนี้:
// const res = await api.get('/auth/me');
// console.log(res.data.user);
```
