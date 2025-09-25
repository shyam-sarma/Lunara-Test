
  # Lunara Chat Screen

  This is a code bundle for Lunara Chat Screen. The original project is available at https://www.figma.com/design/dFoTYi4SNE7BQQsLVOcA5c/Lunara-Chat-Screen.

  ## Running the code

Run `npm i` to install the dependencies.

Create a Python virtual environment in the repository root and install the backend requirements:

```
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements-dev.txt
```

Run the React frontend and Flask backend together during development:

```
npm run dev:full
```

You can also run the servers independently via `npm run dev` (frontend) and `npm run backend` (Flask).

Backend unit tests are executed with:

```
pytest backend/tests
```
  