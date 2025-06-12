# System Dynamics Backend

This project provides a simple REST API for running discrete-time system dynamics simulations. It is written in Go using [Fiber](https://github.com/gofiber/fiber) and [GORM](https://gorm.io).

## Data Models

The application stores simulation configuration in an SQLite database. Main models are defined under `models/`:

- **Project** – container for a group of simulation elements【F:models/projects.go†L8-L11】
- **Stock** – quantity with an initial expression and a project association【F:models/stocks.go†L8-L13】
- **Variable** – named expression evaluated each step within a project【F:models/variables.go†L8-L13】
- **Flow** – expression that moves values between stocks each step【F:models/flows.go†L8-L13】

`Flow.FromStock` or `Flow.ToStock` may be `nil`, representing a source or sink stock.

## Simulation Flow

`POST /simulate` accepts a `project_id` and the number of steps to run. Execution happens in `controllers/simulation_controller.go`:

1. Stocks and variables for the project are loaded (lines 30‑56)
2. Flows connected to those stocks are fetched (lines 58‑66)
3. For each step:
   - Variable expressions are evaluated with the current stock and variable values (lines 69‑77)
   - Each flow expression is evaluated, the result is subtracted from the `FromStock` and added to the `ToStock` (lines 78‑98)
   - A snapshot of all stock and variable values is appended to the results (lines 99‑107)
4. The endpoint returns the collected step data as JSON (lines 108‑110)

The expression evaluator in `utils/evaluator.go` replaces tokens like `[StockName]` or `[VariableName]` with their integer values and executes the arithmetic expression【F:utils/evaluator.go†L12-L31】.

## API Routes

Routes are configured in `routes/routes.go` and include CRUD operations for projects, stocks, variables and flows. The simulation endpoint is available at `POST /simulate`【F:routes/routes.go†L8-L27】.

## Running the Server

```
go run main.go
```

The server listens on `localhost:2000` by default.

