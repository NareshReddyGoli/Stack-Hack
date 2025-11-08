import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import VerifyEmail from './pages/VerifyEmail'
import About from './pages/public/About'
import Docs from './pages/public/Docs'
import Contact from './pages/public/Contact'
import './App.css'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import CSVUploadPage from './pages/admin/CSVUploadPage'
import GenerateTimetable from './pages/admin/GenerateTimetable'
import TimetableList from './pages/admin/TimetableList'
import TimetableEditor from './pages/admin/TimetableEditor'
import FacultyManagement from './pages/admin/FacultyManagement'
import TimingTemplateEditor from './pages/admin/TimingTemplateEditor'
import Analytics from './pages/admin/Analytics'
import Logs from './pages/admin/Logs'
import TimetablePreview from './pages/admin/TimetablePreview'
import ExternalImport from './pages/admin/ExternalImport'
import PythonScheduler from './pages/admin/PythonScheduler'
import Students from './pages/admin/Students'
import FacultyTimetables from './pages/admin/FacultyTimetables'
import FacultyUnavailability from './pages/admin/FacultyUnavailability'
import AvailableRooms from './pages/admin/AvailableRooms'
import AvailableFaculty from './pages/admin/AvailableFaculty'
import FacultyLayout from './pages/faculty/FacultyLayout'
import FacultySchedule from './pages/faculty/Schedule'
import FacultyUnavailable from './pages/faculty/Unavailable'
import FacultyNotifications from './pages/faculty/Notifications'
import FacultyProfile from './pages/faculty/Profile'
import StudentLayout from './pages/student/StudentLayout'
import StudentTimetable from './pages/student/Timetable'
import StudentNotifications from './pages/student/Notifications'
import StudentDownload from './pages/student/Download'
import DashboardRedirect from './pages/DashboardRedirect'
import NavbarWithNotifications from './components/NavbarWithNotifications'
import { useState, useEffect } from 'react'
import Updates from './pages/admin/Updates'

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user info on mount
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.sub) {
          setUser(data);
        }
      })
      .catch(console.error);
  }, []);
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PythonScheduler />} />
          <Route path="python-scheduler" element={<PythonScheduler />} />
          <Route path="generate" element={<GenerateTimetable />} />
          <Route path="timetables" element={<TimetableList />} />
          <Route path="preview" element={<TimetablePreview />} />
          <Route path="editor" element={<TimetableEditor />} />
          <Route path="faculty" element={<FacultyManagement />} />
          <Route path="faculty-timetables" element={<FacultyTimetables />} />
          <Route path="faculty-unavailability" element={<FacultyUnavailability />} />
          <Route path="available-rooms" element={<AvailableRooms />} />
          <Route path="available-faculty" element={<AvailableFaculty />} />
          <Route path="students" element={<Students />} />
          <Route path="templates" element={<TimingTemplateEditor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="logs" element={<Logs />} />
          <Route path="updates" element={<Updates />} />
        </Route>

        <Route path="/faculty" element={<FacultyLayout />}>
          <Route index element={<FacultySchedule />} />
          <Route path="unavailable" element={<FacultyUnavailable />} />
          <Route path="notifications" element={<FacultyNotifications />} />
          <Route path="profile" element={<FacultyProfile />} />
        </Route>

        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentTimetable />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="download" element={<StudentDownload />} />
        </Route>
      </Routes>
      
    </BrowserRouter>
  )
}
