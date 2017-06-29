using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;

using OrdBaseCore.Services;
using OrdBaseCore.Models;

namespace OrdBaseCore.Models 
{
    public class TranslationDb : DbContext 
    {
        public TranslationDb(DbContextOptions<TranslationDb> options)
            :base(options)
        {}

        public DbSet<ClientLanguage> ClientLanguage { get; set; }
        public DbSet<Client> Client { get; set; }
        public DbSet<Language> Language { get; set; }
        public DbSet<Translation> Translation { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {   
            // @note
            // Have to use fluent API in two cases, as data annotations are not supported yet for:
            // - indexes 
            // - Composite keys
            //
            modelBuilder.Entity<Client>()
                .HasIndex(row => row.ApiKey)
                .IsUnique();

            
            modelBuilder.Entity<Translation>()
                .HasKey(t => new { 
                    t.ClientKey, 
                    t.LanguageKey,
                    t.Container,
                    t.Key
                });

            modelBuilder.Entity<ClientLanguage>()
                .HasKey(t => new {
                    t.ClientId,
                    t.LanguageId
                });
        }

        public static void Seed(TranslationDb context) 
        {
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            
            LanguageRepository.AddTestData(context);
            ClientRepository.AddTestData(context);
            TranslationRepository.AddTestData(context);

            context.SaveChanges();
            context.Dispose();
        }
    }
}