import React from "react";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import Swal from "sweetalert2"; 
import "bootstrap/dist/css/bootstrap.min.css";

const NavBarHeader = ({ userName, handleLogout }) => {
  const confirmLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        handleLogout(); 
      }
    });
  };

  return (
    <Container fluid className="bg-success">
      <Navbar expand="lg">
        <Navbar.Brand className="text-white" href="#">User List Dashboard</Navbar.Brand>
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            {userName ? ( 
              <NavDropdown 
                align="end" 
                title={<span style={{ color: "white" }}>{userName}</span>} 
                id="navbar-dropdown"
                className="custom-dropdown"
              >
                <NavDropdown.Item onClick={confirmLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </Container>
  );
};

export default NavBarHeader;
