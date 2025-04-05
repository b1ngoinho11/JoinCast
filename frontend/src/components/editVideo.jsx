// EditVideoModal.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const playlists = [
    { id: 1, name: "Playlist 1" },
    { id: 2, name: "Playlist 2" },
    { id: 3, name: "Playlist 3" },
];

const EditVideoModal = ({ show, handleClose, video, handleEditSubmit }) => {
    const [videoName, setVideoName] = React.useState(video.name);
    const [description, setDescription] = React.useState(video.description); // New state for description
    const [thumbnail, setThumbnail] = React.useState(video.thumbnail); // New state for thumbnail
    const [selectedPlaylist, setSelectedPlaylist] = React.useState(""); // New state for selected playlist

    const handleSubmit = (e) => {
        e.preventDefault();
        handleEditSubmit(video.id, videoName, description, thumbnail, selectedPlaylist);
        handleClose();
    };

    return (
        <Modal show={show} onHide={handleClose} style={{background: 'rgba(0, 0, 0, 0.1)'}}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Video</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit} style={{ borderRadius: '50%'}}>
                    <Form.Group controlId="formVideoName">
                        <Form.Label>Video Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={videoName}
                            onChange={(e) => setVideoName(e.target.value)}
                            placeholder="Enter video title"
                        />
                    </Form.Group>
                    <Form.Group controlId="formDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter video description"
                        />
                    </Form.Group>
                    <Form.Group controlId="formThumbnail">
                        <Form.Label>Thumbnail URL</Form.Label>
                        <Form.Control
                            type="text"
                            value={thumbnail}
                            onChange={(e) => setThumbnail(e.target.value)}
                            placeholder="Enter thumbnail URL"
                        />
                    </Form.Group>
                    <Form.Group controlId="formPlaylist">
                        <Form.Label>Playlist</Form.Label>
                        <Form.Control
                            as="select"
                            value={selectedPlaylist}
                            onChange={(e) => setSelectedPlaylist(e.target.value)}
                        >
                            <option value="">Select a playlist</option>
                            {playlists.map((playlist) => (
                                <option key={playlist.id} value={playlist.id}>
                                    {playlist.name}
                                </option>
                            ))}
                        </Form.Control>
                    </Form.Group>
                    <Button variant="primary" type="submit" style={{ width: "100%", margin: "10px 0" }}>
                        Save Changes
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditVideoModal;