import { AuthService } from '../services/AuthService.js';

export class AuthController {
  static register(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const result = AuthService.signup({ name, email, password, role });
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  static login(req, res) {
    try {
      const { email, password } = req.body;
      const result = AuthService.login({ email, password });
      res.json(result);
    } catch (e) {
      res.status(401).json({ error: e.message });
    }
  }

  static getMe(req, res) {
    try {
      const result = AuthService.getProfile(req.user.id);
      res.json(result);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }
}
