package controllers

import (
	"SystemDynamicsBackend/database"
	"SystemDynamicsBackend/models"
	"SystemDynamicsBackend/utils"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// SimulateRequest represents the simulation input.
type SimulateRequest struct {
	ProjectID uint `json:"project_id" validate:"required"`
	SimStep   int  `json:"sim_step" validate:"required"`
}

// Simulate runs a simple discrete simulation for the given project.
func Simulate(ctx *fiber.Ctx) error {
	req := new(SimulateRequest)
	if err := ctx.BodyParser(req); err != nil {
		return ctx.JSON(fiber.Map{"success": false, "message": "Invalid Request"})
	}
	if err := database.VL.Struct(req); err != nil {
		valErr := err.(validator.ValidationErrors)[0]
		msg := fmt.Sprintf("Field %s failed on %s with value %s", valErr.Field(), valErr.Tag(), valErr.Value())
		return ctx.JSON(fiber.Map{"success": false, "message": msg})
	}

	var stocks []models.Stock
	if res := models.GetStocksByProjectId(&stocks, req.ProjectID); res.Error != nil {
		return ctx.JSON(fiber.Map{"success": false, "message": res.Error.Error()})
	}

	var variables []models.Variable
	if res := models.GetVariablesByProjectId(&variables, req.ProjectID); res.Error != nil {
		return ctx.JSON(fiber.Map{"success": false, "message": res.Error.Error()})
	}

	stockValues := map[string]int{}
	for _, s := range stocks {
		val, err := utils.EvaluateExpression(s.InitialValue, stockValues, nil)
		if err != nil {
			return ctx.JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		stockValues[s.Name] = val
	}

	variableValues := map[string]int{}
	for _, v := range variables {
		val, err := utils.EvaluateExpression(v.Value, stockValues, variableValues)
		if err != nil {
			return ctx.JSON(fiber.Map{"success": false, "message": err.Error()})
		}
		variableValues[v.Name] = val
	}

	stockIDs := make([]uint, 0, len(stocks))
	for _, s := range stocks {
		stockIDs = append(stockIDs, uint(s.ID))
	}

	var flows []models.Flow
	if res := models.GetFlowsByStocks(&flows, stockIDs); res.Error != nil {
		return ctx.JSON(fiber.Map{"success": false, "message": res.Error.Error()})
	}

	results := []fiber.Map{}
	for step := 0; step < req.SimStep; step++ {
		stepVars := map[string]int{}
		for _, v := range variables {
			val, err := utils.EvaluateExpression(v.Value, stockValues, variableValues)
			if err != nil {
				return ctx.JSON(fiber.Map{"success": false, "message": err.Error()})
			}
			stepVars[v.Name] = val
		}
		// apply flows
		for _, f := range flows {
			val, err := utils.EvaluateExpression(f.Name, stockValues, stepVars)
			if err != nil {
				return ctx.JSON(fiber.Map{"success": false, "message": err.Error()})
			}
			if f.FromStock != nil {
				for _, s := range stocks {
					if uint(s.ID) == *f.FromStock {
						stockValues[s.Name] -= val
					}
				}
			}
			if f.ToStock != nil {
				for _, s := range stocks {
					if uint(s.ID) == *f.ToStock {
						stockValues[s.Name] += val
					}
				}
			}
		}
		snap := fiber.Map{}
		for k, v := range stockValues {
			snap[k] = v
		}
		for k, v := range stepVars {
			snap[k] = v
			variableValues[k] = v
		}
		results = append(results, snap)
	}

	return ctx.JSON(fiber.Map{"success": true, "message": "Simulation completed", "data": results})
}
