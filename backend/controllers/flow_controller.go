package controllers

import (
	"SystemDynamicsBackend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateFlowRequest struct {
	Name      string `json:"name"`
	FromStock *uint  `json:"from_stock"`
	ToStock   *uint  `json:"to_stock"`
}

type UpdateFlowRequest struct {
	Name      string `json:"name"`
	FromStock *uint  `json:"from_stock"`
	ToStock   *uint  `json:"to_stock"`
}

func CreateFlow(ctx *fiber.Ctx) error {
	success := true
	message := "Flow Successfully Created"
	req := new(CreateFlowRequest)
	if err := ctx.BodyParser(req); err != nil {
		success = false
		message = "Invalid Request Format"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}
	flow := models.Flow{
		Name:      req.Name,
		FromStock: req.FromStock,
		ToStock:   req.ToStock,
	}
	if res := models.CreateFlow(&flow); res.Error != nil {
		success = false
		message = res.Error.Error()
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": flow})
}

func UpdateFlow(ctx *fiber.Ctx) error {
	success := true
	message := "Flow Successfully Updated"
	id := ctx.Params("id")
	req := new(UpdateFlowRequest)
	if err := ctx.BodyParser(req); err != nil {
		success = false
		message = "Invalid Format"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}
	res := models.UpdateFlow(req, id)
	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to update Flow"
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message})
}

func GetFlows(ctx *fiber.Ctx) error {
	success := true
	message := "Data Successfully Fetched"
	var flows []models.Flow
	res := models.GetFlows(&flows)
	if res.Error != nil {
		success = false
		message = "Failed to Get data from database"
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": flows})
}

func GetFlow(ctx *fiber.Ctx) error {
	success := true
	message := "Successfully Fetched"
	id := ctx.Params("id")
	var flow models.Flow
	res := models.GetFlow(&flow, id)
	if res.Error != nil {
		success = false
		message = "Failed to Get data from database"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": flow})
}

func DeleteFlow(ctx *fiber.Ctx) error {
	success := true
	message := "Flow Successfully Deleted"
	id := ctx.Params("id")
	res := models.DeleteFlow(id)
	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to Delete Flow"
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message})
}
