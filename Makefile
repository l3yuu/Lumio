.PHONY: install backend frontend dev

install:
	@echo "Installing dependencies..."
	cd backend && python3 -m pip install -r requirements.txt
	cd frontend && npm install

backend:
	@echo "Starting FastAPI backend..."
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	@echo "Starting React frontend..."
	cd frontend && npm run dev

dev:
	@echo "Starting both servers..."
	@echo "Note: This runs both in one terminal. It's better to run them in separate terminals."
	(cd backend && uvicorn main:app --reload --port 8000) & (cd frontend && npm run dev)
