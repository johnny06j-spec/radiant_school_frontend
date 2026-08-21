// src/hooks/useStudentForm.js
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export const useStudentForm = (setActiveTab, explicitStudentId) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Prioritize direct prop state over router location state to avoid auth context drops
  const studentId = explicitStudentId || location.state?.studentId || null;
  const isEditMode = !!studentId;

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatedCreds, setGeneratedCreds] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const [formData, setFormData] = useState({
    surname: "", 
    firstName: "", 
    otherName: "", 
    assignedClass: "KG 1",
    intakeSession: "2026/2027",
    admittedSession: "2026/2027",
    intakeTerm: "First Term",
    admittedTerm: "First Term",
    religion: "", 
    gender: "", 
    status: "Active", 
    dob: "",
    bloodGroup: "", 
    genotype: "", 
    stateOfOrigin: "", 
    lga: "", 
    homeTown: "",
    email: "", 
    phone: "", 
    address: "", 
    fatherName: "", 
    fatherPhone: "",
    motherName: "", 
    motherPhone: "", 
    guardianAddress: ""
  });

  // Safely handle going back without changing location.state mid-flight!
  const handleBackToDirectory = () => {
    if (typeof setActiveTab === "function") {
      setActiveTab("directory");
    } else {
      navigate("/dashboard/directory");
    }
  };

  useEffect(() => {
    if (isEditMode && studentId) {
      const fetchStudentProfileData = async () => {
        setIsLoadingProfile(true);
        setErrorMsg("");
        try {
          const response = await API.get(`/students/${studentId}`);
          if (response.data) {
            const data = response.data.student || response.data;
            
            const formattedDob = data.dob && data.dob !== "Not Specified" ? new Date(data.dob).toISOString().split("T")[0] : "";
            let mappedClass = data.currentClass || data.assignedClass || "KG 1";

            const sessionVal = data.intakeSession || data.admittedSession || data.admissionSession || "2026/2027";
            const termVal = data.intakeTerm || data.admittedTerm || data.admissionTerm || "First Term";

            setFormData({
              surname: data.surname || "",
              firstName: data.firstName || "",
              otherName: data.otherName || "",
              assignedClass: mappedClass,
              intakeSession: sessionVal,
              admittedSession: sessionVal,
              intakeTerm: termVal,
              admittedTerm: termVal,
              religion: data.religion || "",
              gender: data.gender || "",
              status: data.status || "Active",
              dob: formattedDob,
              bloodGroup: data.bloodGroup || "",
              genotype: data.genotype || "",
              stateOfOrigin: data.stateOfOrigin || "",
              lga: data.lga || data.LGA || "",
              homeTown: data.homeTown || data.placeOfBirth || "",
              email: data.email || "",
              phone: data.phone || data.phoneNumber || "",
              address: data.address || data.residentialAddress || "",
              fatherName: data.fatherName || "",
              fatherPhone: data.fatherPhone || "",
              motherName: data.motherName || "",
              motherPhone: data.motherPhone || "",
              guardianAddress: data.guardianAddress || ""
            });

            if (data.passportPhoto) setImagePreview(data.passportPhoto);
          }
        } catch (err) {
          setErrorMsg("Failed to stream database records.");
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchStudentProfileData();
    }
  }, [studentId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Sync aliases automatically
      if (name === "intakeSession" || name === "admittedSession") {
        updated.intakeSession = value;
        updated.admittedSession = value;
      }
      if (name === "intakeTerm" || name === "admittedTerm") {
        updated.intakeTerm = value;
        updated.admittedTerm = value;
      }
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Image size exceeds limit (Max 2MB).");
      return;
    }
    setErrorMsg("");
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const dataContainer = new FormData();
      if (selectedFile) dataContainer.append("passportPhoto", selectedFile);
      
      const sessionVal = formData.intakeSession || formData.admittedSession || "2026/2027";
      const termVal = formData.intakeTerm || formData.admittedTerm || "First Term";

      dataContainer.append("currentClass", formData.assignedClass);
      dataContainer.append("intakeSession", sessionVal);
      dataContainer.append("admittedSession", sessionVal);
      dataContainer.append("admissionSession", sessionVal);
      dataContainer.append("intakeTerm", termVal);
      dataContainer.append("admittedTerm", termVal);
      dataContainer.append("admissionTerm", termVal);

      Object.keys(formData).forEach((key) => {
        if (!["assignedClass", "intakeSession", "admittedSession", "intakeTerm", "admittedTerm"].includes(key)) {
          dataContainer.append(key, formData[key]);
        }
      });

      if (isEditMode) {
        const response = await API.put(`/students/${studentId}`, dataContainer, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (response.status === 200 || response.data?.success) {
          setSuccessMsg("🎉 Student profile updated successfully!");
          setTimeout(() => {
            handleBackToDirectory();
          }, 1500);
        }
      } else {
        const response = await API.post("/auth/register-student", dataContainer, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (response.data?.success && response.data?.credentials) {
          setSuccessMsg("Student processed cleanly!");
          setGeneratedCreds(response.data.credentials);
        } else {
          setSuccessMsg("🎉 Student Registered Successfully!");
          setTimeout(() => {
            handleBackToDirectory();
          }, 1500);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Database synchronization failure.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    studentId, isEditMode, isLoadingProfile, isSaving, successMsg, errorMsg,
    imagePreview, generatedCreds, copiedField, formData, setCopiedField,
    handleBackToDirectory, handleChange, handleFileChange, setSelectedFile, setImagePreview, handleSubmit
  };
};