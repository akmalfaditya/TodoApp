using AutoMapper;
using TodoApp.Application.Features.Todos.Dtos;
using TodoApp.Domain.Entities;

namespace TodoApp.Application.Features.Todos.Mappings;

public class TodoMappingProfile : Profile
{
    public TodoMappingProfile()
    {
        CreateMap<TodoItem, TodoResponseDto>()
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()));

        CreateMap<CreateTodoRequestDto, TodoItem>();

        CreateMap<UpdateTodoRequestDto, TodoItem>();
    }
}

