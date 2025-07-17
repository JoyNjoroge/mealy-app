<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![MIT License][license-shield]][license-url]

<br />
<div align="center">
  <a href="https://github.com/JoyNjoroge/mealy-app">
    <img src="images/logo.png" alt="Logo" width="80" height="80" />
  </a>

  <h3 align="center">Mealy App - Backend</h3>

  <p align="center">
    A RESTful backend API for managing meals, users, and orders, built with Flask and PostgreSQL.
    <br />
    <a href="https://github.com/JoyNjoroge/mealy-app"><strong>Explore the repo »</strong></a>
    <br />
    <br />
    <a href="#">Live Demo (coming soon)</a>
    ·
    <a href="https://github.com/JoyNjoroge/mealy-app/issues/new?labels=bug&template=bug-report.md">Report Bug</a>
    ·
    <a href="https://github.com/JoyNjoroge/mealy-app/issues/new?labels=enhancement&template=feature-request.md">Request Feature</a>
  </p>
</div>

---

<details>
  <summary> Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#sendgrid-integration">SendGrid Integration</a></li>
    <li><a href="#ci--cd">CI / CD</a></li>
    <li><a href="#pull-request-template">Pull Request Template</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

---

## About The Project

**Mealy App Backend** is the backend service for a meal ordering application. It supports:

- User registration and login with JWT
- CRUD operations for meals and menus
- Order tracking and management
- Admin-level operations
- Secure email notifications using SendGrid

This backend is RESTful and modular, with database models separated from views and logic.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

##  Built With

- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Flask-Migrate](https://flask-migrate.readthedocs.io/)
- [SendGrid](https://sendgrid.com/)
- [JWT](https://flask-jwt-extended.readthedocs.io/)
- [GitHub Actions](https://github.com/features/actions)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

##  Getting Started

### ✅ Prerequisites

- Python 3.10+
- PostgreSQL installed and running
- Git & pip

###  Installation

```bash
# Clone the repo
git clone https://github.com/JoyNjoroge/mealy-app.git
cd mealy-app/Backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
flask db init           # Run only once
flask db migrate -m "initial migration"
flask db upgrade
````

###  .env Setup

Create a `.env` file:

```env
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/mealy_db
JWT_SECRET_KEY=your-jwt-secret
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=your_verified_sendgrid_email@example.com
```

> Don't forget to copy `.env.example` and keep secrets out of Git.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

##  Usage

### 🔃 Run the API

```bash
flask run
```

Open: `http://127.0.0.1:5000`

### Run Tests

```bash
pytest
```

### Linting

```bash
black .
isort .
flake8 .
bandit -r .
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## SendGrid Integration

This app uses [SendGrid](https://sendgrid.com/) to send registration emails, order updates, and other notifications.

To enable:

1. Create an account at [sendgrid.com](https://sendgrid.com/)
2. Create an API Key under **Settings > API Keys**
3. Verify a sender email
4. Set `SENDGRID_API_KEY` and `EMAIL_FROM` in your `.env`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

##  CI / CD

We use **GitHub Actions** for automated checks:

* Linting (`flake8`, `black`, `isort`, `bandit`)
* Unit Tests

Workflow file: `.github/workflows/ci.yml`

Triggered on:

* Push to `main`
* Pull requests to `main`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Pull Request Template

```markdown
## Description

## Ticket[]()

## Types Of Changes
- [ ] Bug fix
- [ ] New Feature
- [ ] Breaking Changes

## Checklist:
- [ ] My code follows the code style of this project
- [ ] All new and existing tests passed
- [ ] My code has been linted and formatted correctly
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings

## How can this code be tested?
1. After cloning this repo, run `git pull`
2. Checkout to [Branchlink](Branchlink)
3. Run the changes in the browser
4. Screenshots
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 👥 Contributing

1. Fork this repo
2. Create your branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m "feat: add feature"`
4. Push to GitHub: `git push origin feat/my-feature`
5. Open a PR using the template above

### Top Contributors

* Joy Njoroge – [@JoyNjoroge](https://github.com/JoyNjoroge)
* Lenah Mbae – [@lenah-mbae](https://github.com/lenah-mbae)
* Ian Nyicon – [@iannyicon](https://github.com/iannyicon)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the MIT License. See `LICENSE` for more info.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contact

**Joy Njoroge**
GitHub: [@JoyNjoroge](https://github.com/JoyNjoroge)

**Lenah Mbae**
GitHub: [@lenah-mbae](https://github.com/lenah-mbae)

**Ian Nyicon**
GitHub: [@iannyicon](https://github.com/iannyicon)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

##  Acknowledgments

* Flask Docs
* SendGrid Docs
* GitHub Actions
* Real Python
* PostgreSQL Docs

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS -->


[contributors-url]: https://github.com/JoyNjoroge/mealy-app/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/JoyNjoroge/mealy-app.svg?style=for-the-badge
[forks-url]: https://github.com/JoyNjoroge/mealy-app/network/members
[license-url]: https://github.com/JoyNjoroge/mealy-app/blob/main/LICENSE

```

