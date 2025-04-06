import { useState, useEffect, useContext } from "react";
import { Button, Alert, Image, Card, Spinner } from "react-bootstrap";
import { AuthContext } from "../contexts/authContext";
import axios from "axios";
import Cookies from "js-cookie";

const AccountPage = () => {
    const [previewImage, setPreviewImage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { setUser } = useContext(AuthContext);
    
    // State for user data from backend
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        profile_picture: "",
        id: "",
        created_at: ""
    });

    // API base URL - should match your backend
    const API_URL = "http://localhost:8000/api/v1";

    // Fetch user data from backend
    const fetchUserData = async () => {
        try {
            setLoading(true);
            const token = Cookies.get("auth_token");
            
            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setUserData(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching user data:", error);
            setErrorMessage("Failed to load user data. Please try again.");
            setLoading(false);
        }
    };

    // Load user data on component mount
    useEffect(() => {
        fetchUserData();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
            
            // Upload the image to the server
            uploadProfilePicture(file);
        }
    };

    const uploadProfilePicture = async (file) => {
        try {
            setUploading(true);
            const token = Cookies.get("auth_token");
            
            const formData = new FormData();
            formData.append("file", file); // Changed from "profile_picture" to "file" to match FastAPI's expected parameter name
            
            const response = await axios.post(`${API_URL}/users/me/profile-picture`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                }
            });
            
            
            // Update user data with new profile picture
            setUserData(prevData => ({
                ...prevData,
                profile_picture: response.data.profile_picture
            }));
            
            // If using AuthContext to manage user state, update that too
            if (setUser) {
                setUser(prevUser => ({
                    ...prevUser,
                    profile_picture: response.data.profile_picture
                }));
            }
            
            setSuccessMessage("Profile picture updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
            setUploading(false);
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            setErrorMessage(`Failed to upload profile picture: ${error.response?.data?.detail || error.message}`);
            setUploading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Get the full profile picture URL
    const getProfilePictureUrl = () => {
        // Use preview image if available (for local preview before upload)
        if (previewImage) return previewImage;
        
        // Use the profile picture from backend if available
        if (userData.profile_picture) {
            // Construct URL to the backend-served image
            return `${API_URL}/users/profile-picture/${userData.profile_picture}`;
        }
        
        // Return a default avatar if no profile picture is set
        return "https://via.placeholder.com/170?text=No+Image";
    };

    return (
        <div style={{ flex: 1, padding: '20px'}}>
            <h1 className="mb-4" style={{padding: '0px 150px'}}>Account Information</h1>
            
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}

            <div style={{ padding: '0px 150px'}}>
                {loading ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                ) : (
                    <>
                        {/* Profile Image Upload - Centered Section */}
                        <div className="d-flex flex-column align-items-center mb-4">
                            <div style={{ 
                                width: "170px", 
                                height: "170px", 
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2px solid #ccc",
                                marginBottom: "1rem",
                                position: "relative"
                            }}>
                                <Image 
                                    src={getProfilePictureUrl()}
                                    style={{ 
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover" 
                                    }}
                                />
                                {uploading && (
                                    <div style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: "rgba(255,255,255,0.7)"
                                    }}>
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="d-none"
                                    id="profilePictureInput"
                                />
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => document.getElementById('profilePictureInput').click()}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Upload New Photo'}
                                </Button>
                            </div>
                        </div>

                        {/* User Information Card */}
                        <Card className="mb-4">
                            <Card.Body>
                                <div className="mb-3">
                                    <h5>Username</h5>
                                    <p>{userData.username}</p>
                                </div>
                                
                                <div className="mb-3">
                                    <h5>Email</h5>
                                    <p>{userData.email}</p>
                                </div>

                                <div className="mb-3">
                                    <h5>User ID</h5>
                                    <p className="text-muted">{userData.id}</p>
                                </div>

                                <div className="mb-3">
                                    <h5>Account Created</h5>
                                    <p>{formatDate(userData.created_at)}</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountPage;