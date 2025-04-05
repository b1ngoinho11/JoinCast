import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import '../css/auth.css';
import { AuthContext } from '../contexts/authContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(true);
    navigate('/');
  };

  return (
    <Container className=" background" fluid >
      <Row className="justify-content-center" style={{background: 'transparent'}}>
        <Col md={6} lg={4}>
          <Card className="p-4" style={{ marginTop: "20%", background: 'rgba(255, 255, 255, 0.5)'}}>
            <h2 className="text-center mb-4" style={{background:'transparent'}}>Login</h2>
            <Form onSubmit={handleSubmit} >
              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mb-3">
                Login
              </Button>
              
              <div className="text-center">
                <Link to="/signup">Create an account</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your signup logic here
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    alert('Signup functionality to be implemented');
    navigate('/');
  };

  return (
    <Container className="background" fluid>
      <Row className="justify-content-center" style={{background: 'transparent'}}>
        <Col md={6} lg={4}>
          <Card className="p-4" style={{marginTop: "20%", background: 'rgba(255, 255, 255, 0.5)'}}>
            <h2 className="text-center mb-4">Sign Up</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group className='mb-3' controlId='formUsername'>
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formConfirmPassword">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mb-3">
                Sign Up
              </Button>
              
              <div className="text-center">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}