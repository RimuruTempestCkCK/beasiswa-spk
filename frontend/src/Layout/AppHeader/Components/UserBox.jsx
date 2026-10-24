import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DropdownToggle,
  DropdownMenu,
  Nav,
  NavItem,
  NavLink,
  Button,
  UncontrolledButtonDropdown,
  Badge,
} from 'reactstrap';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { logout } from '../../../features/auth/authSlice';
import avatar1 from '../../../assets/utils/images/avatars/1.jpg';

export default function UserBox() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);

  const handleLogout = () => {
    dispatch(logout());
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <div className="header-btn-lg pe-0">
      <div className="widget-content p-0">
        <div className="widget-content-wrapper">
          <div className="widget-content-left">
            <UncontrolledButtonDropdown>
              <DropdownToggle color="link" className="p-0">
                <img width={42} className="rounded-circle" src={avatar1} alt="" />
                <FontAwesomeIcon className="ms-2 opacity-8" icon={faAngleDown} />
              </DropdownToggle>
              <DropdownMenu end className="rm-pointers dropdown-menu-lg">
                <div className="dropdown-menu-header">
                  <div className="dropdown-menu-header-inner bg-info">
                    <div className="menu-header-image opacity-2" />
                    <div className="menu-header-content text-start">
                      <div className="widget-content p-0">
                        <div className="widget-content-wrapper">
                          <div className="widget-content-left me-3">
                            <img width={42} className="rounded-circle" src={avatar1} alt="" />
                          </div>
                          <div className="widget-content-left">
                            <div className="widget-heading">{user?.name || 'Pengguna Sistem'}</div>
                            <div className="widget-subheading opacity-8">{user?.email || 'Admin/Operator'}</div>
                          </div>
                          <div className="widget-content-right me-2">
                            <Badge color="light" className="text-dark">
                              {user?.role || 'operator'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Nav vertical className="p-2">
                  <NavItem>
                    <Button color="danger" block onClick={handleLogout}>
                      Keluar (Logout)
                    </Button>
                  </NavItem>
                </Nav>
              </DropdownMenu>
            </UncontrolledButtonDropdown>
          </div>
          <div className="widget-content-left ms-3 header-user-info">
            <div className="widget-heading">{user?.name || 'Administrator'}</div>
            <div className="widget-subheading">{user?.role || 'Admin SPK'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
