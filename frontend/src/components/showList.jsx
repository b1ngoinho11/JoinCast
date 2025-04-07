// src/showList.js
import { useState, useEffect, useContext } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { AuthContext } from '../contexts/authContext';
import api from '../services/api';

const ShowList = ({ title }) => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchShows = async () => {
      if (!user || !user.id) return;
      
      try {
        setLoading(true);
        const response = await api.post('/api/v1/shows/my-shows', {
          creator_id: user.id
        });
        setShows(response.data);
      } catch (err) {
        console.error('Error fetching shows:', err);
        setError('Failed to load shows');
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [user]);

  if (loading) {
    return (
      <div>
        <h3>{title}</h3>
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3>{title}</h3>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h3>{title}</h3>
      {shows.length === 0 ? (
        <p>No shows found. Create your first show!</p>
      ) : (
        <div>
          {/* Display shows here */}
          {shows.map(show => (
            <div key={show.id} className="mb-3 p-3 border rounded">
              <h4>{show.name}</h4>
              <p>{show.description}</p>
              <small>Episodes: {show.episodes?.length || 0}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowList;