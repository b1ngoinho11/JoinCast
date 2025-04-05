import React, { useState } from "react";
import { Form, Button, Alert, Image } from "react-bootstrap";

const AccountPage = () => {
    const [previewImage, setPreviewImage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    // Mock user data
    const [userData, setUserData] = useState({
        username: "JohnDoe",
        description: "Tech enthusiast and content creator",
        profileImage: null,
        password: "password123"
    });

    const [formData, setFormData] = useState({
        username: userData.username,
        currentPassword: "",
        newPassword: "",
        description: userData.description,
        profileImage: null
    });

    const [errors, setErrors] = useState({
        username: "",
        currentPassword: "",
        newPassword: ""
    });

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: "",
            currentPassword: "",
            newPassword: ""
        };

        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
            isValid = false;
        }

        if (formData.newPassword && !formData.currentPassword) {
            newErrors.currentPassword = "Current password is required to change password";
            isValid = false;
        }

        if (formData.newPassword && formData.newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");
    
        if (!validateForm()) return;
    
        // Check if the entered current password matches the stored one
        if (formData.newPassword && formData.currentPassword !== userData.password) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                currentPassword: "Incorrect current password"
            }));
            return;
        }
    
        // Mock "save" functionality
        setUserData({
            ...userData,
            username: formData.username,
            description: formData.description,
            password: formData.newPassword || userData.password // Update password only if a new one is set
        });
    
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
    
        // Reset form (except username/description)
        setFormData({
            ...formData,
            currentPassword: "",
            newPassword: "",
            profileImage: null
        });
    
        setErrors({
            username: "",
            currentPassword: "",
            newPassword: ""
        });
    };

    

    return (
            <div style={{ flex: 1, padding: '20px'}}>
                <h1 className="mb-4" style={{padding: '0px 150px'}}>Account Settings</h1>
                
                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}

                <Form onSubmit={handleSubmit} style={{ padding: '0px 150px'}}>
                {/* Profile Image Upload - Centered Section */}
                <div className="d-flex flex-column align-items-center mb-4">
                    <div style={{ 
                        width: "170px", 
                        height: "170px", 
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "2px solid #ccc",
                        marginBottom: "1rem"
                    }}>
                        <Image 
                            src={previewImage || "../assets/logo.png"}
                            style={{ 
                                width: "100%",
                                height: "100%",
                                objectFit: "cover" 
                            }}
                        />
                    </div>
                    
                    <Form.Group className="text-center">
                        <Form.Label className="d-block">
                            Change Profile Picture
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="d-none"
                            />
                        </Form.Label>
                        <Button 
                            variant="outline-secondary" 
                            onClick={() => document.querySelector('input[type="file"]').click()}
                        >
                            Upload New Photo
                        </Button>
                    </Form.Group>
                </div>

                    {/* Username */}
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            isInvalid={!!errors.username}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.username}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Description */}
                    <Form.Group className="mb-3">
                        <Form.Label>Channel Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Form.Group>

                    {/* Current Password */}
                    <Form.Group className="mb-3">
                        <Form.Label>Current Password (required for changes)</Form.Label>
                        <Form.Control
                            type="password"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            isInvalid={!!errors.currentPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.currentPassword}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* New Password */}
                    <Form.Group className="mb-4">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            isInvalid={!!errors.newPassword}
                        />
                        <Form.Text className="text-muted">
                            Leave blank to keep current password
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                            {errors.newPassword}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        Save Changes
                    </Button>
                </Form>
            </div>
    );
};

export default AccountPage;