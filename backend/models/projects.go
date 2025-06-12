package models

import (
	"SystemDynamicsBackend/database"
	"gorm.io/gorm"
)

type Project struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func CreateProject(project *Project) *gorm.DB {
	return database.DB.Create(&project)
}

func GetProjects(projects *[]Project) *gorm.DB {
	return database.DB.Find(&projects)
}
func GetProject(project *Project, id any) *gorm.DB {
	return database.DB.Where("id = ?", id).First(&project)
}
