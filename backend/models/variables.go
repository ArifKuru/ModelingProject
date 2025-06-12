package models

import (
	"SystemDynamicsBackend/database"
	"gorm.io/gorm"
)

type Variable struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Value     string `json:"value"`
	ProjectID uint   `json:"project_id"`
}

func CreateVariable(variable *Variable) *gorm.DB {
	return database.DB.Create(variable)
}

func GetVariables(vars *[]Variable) *gorm.DB {
	return database.DB.Find(&vars)
}

func GetVariableByID(variable *Variable, id any) *gorm.DB {
	return database.DB.Where("id = ?", id).First(&variable)
}

func GetVariablesByProjectId(vars *[]Variable, projectID any) *gorm.DB {
	return database.DB.Where("project_id = ?", projectID).Find(&vars)
}

func UpdateVariable(data any, id any) *gorm.DB {
	return database.DB.Model(&Variable{}).Where("id = ?", id).Updates(data)
}

func DeleteVariable(id any) *gorm.DB {
	return database.DB.Delete(&Variable{}, id)
}
