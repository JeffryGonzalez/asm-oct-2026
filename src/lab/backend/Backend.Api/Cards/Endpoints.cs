using Backend.Api.Prefs;
using Fisher;
using System.ComponentModel.DataAnnotations;
using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using Wolverine.Http;

namespace Backend.Api.Cards;

public record NameInformation
{
    [Required, MinLength(3), MaxLength(100)]
    public string First { get; set; } = "";
    [Required, MinLength(2), MaxLength(100)]
    public string Last { get; set; } = "";

}
public record ContactItem
{
    public string Kind { get; set; } = "";
    public string Value { get; set; } = "";
}

public class CardRequestEntity
{
    public Guid Id { get; set; }
    public required CardRequestModel SubmittedRequest { get; set; }
    public string Status { get; set; } = "Pending";
}
public record CardRequestModel
{
    public NameInformation Name { get; set; } = new NameInformation();
    [EmailAddress, Required]
    public string PrimaryEmail { get; set; } = "";
    public List<ContactItem> ContactMechanisms { get; set; } = new List<ContactItem>();
}
public static class LibraryCardSignupEndpoints
{
    [WolverinePost("/library-card-requests")]
    public static async Task<IResult> Signup(CardRequestModel request, IDocumentSession session)
    {
        // Here you would handle the signup logic, e.g., save to the database
        // For demonstration, we'll just return the received request
        var entity = new CardRequestEntity
        {
            Id = Guid.NewGuid(),
            SubmittedRequest = request,
            Status = "Pending"
        };

        //foreach(var cm in entity.SubmittedRequest.ContactMechanisms)
        //{
        //    await Task.Delay(1000); // THIS IS CLASSROOM BULL CRAP DON'T DO THIS.
        //}


        session.Store(entity);
        await session.SaveChangesAsync();
        return Results.Ok(entity);
    }



    [WolverineGet("/library-card-requests/{id}")]
    public static async Task<IResult> GetRequest(Guid id, IDocumentSession session)
    {
        var request = await session.LoadAsync<CardRequestEntity>(id);
        if (request == null)
        {
            return Results.NotFound();
        }
        return Results.Ok(request);
    }

    [WolverineGet("/library-card-requests/{id}/events")]
    public static async Task<IResult> GetRequestEvents(Guid id, IDocumentSession session, CancellationToken cancellation)
    {
        var request = await session.LoadAsync<CardRequestEntity>(id);
        if (request is null)
        {
            return Results.NotFound();
        }

        return Results.ServerSentEvents(StreamCardApproval(request, cancellation));
    }

    private static async IAsyncEnumerable<SseItem<object>> StreamCardApproval(
        CardRequestEntity request,
        [EnumeratorCancellation] CancellationToken cancellation)
    {
        yield return new SseItem<object>(new { request.Id }, "subscribed");

        var contactMechanisms = request.SubmittedRequest.ContactMechanisms;
        for (var index = 0; index < contactMechanisms.Count; index++)
        {
            await Task.Delay(TimeSpan.FromSeconds(1), cancellation);

            var contact = contactMechanisms[index];
            yield return new SseItem<object>(
                new
                {
                    request.Id,
                    Contact = contact,
                    Position = index + 1,
                    Total = contactMechanisms.Count
                },
                "contact-reviewed");
        }

        yield return new SseItem<object>(
            new
            {
                request.Id,
                Status = "Approved",
                Message = "Card approved"
            },
            "card-approved");
    }
}