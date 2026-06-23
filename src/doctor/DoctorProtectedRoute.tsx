import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doctorAuth } from "@/lib/doctorApi";

const DoctorProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!doctorAuth.isAuthenticated()) navigate("/doctor/login");
  }, [navigate]);
  if (!doctorAuth.isAuthenticated()) return null;
  return <>{children}</>;
};

export default DoctorProtectedRoute;
