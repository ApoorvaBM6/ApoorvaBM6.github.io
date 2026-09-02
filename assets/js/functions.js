$(document).ready(function() {

    // Project filtering
    $(".project-filter").on("click", function() {

    const filter = $(this).data("filter");

    $(".project-filter").removeClass("active");
    $(this).addClass("active");

    $(".project-preview").each(function() {

        const categories = String($(this).data("category") || "")
            .split("|")
            .map(category => category.trim());

        if (filter === "all" || categories.includes(filter)) {
            $(this).fadeIn(200);
        } else {
            $(this).fadeOut(150);
        }

    });

});

    $(".project-preview").on("click", function(event) {

        // Don't open popup when clicking a link
        if ($(event.target).closest("a").length) {
            return;
        }

        // Remove any existing modal first
        $(".project-modal").remove();

        const project = $(this);
        const details = project.find(".project-details");

        // If there are no project details, don't open a modal
        if (!details.length) {
            return;
        }


        // --------------------------------------------
        // Project metadata
        // --------------------------------------------

        const meta = project.find(".project-meta").prop("outerHTML") || "";


        // --------------------------------------------
        // Project resources
        // --------------------------------------------

        const resources = project.find(".project-resources").length
            ? project.find(".project-resources").prop("outerHTML")
            : "";


        // --------------------------------------------
        // Project body
        //
        // Convert ALL children to HTML.
        // This keeps:
        // - Description
        // - Skills
        // - Contributors
        // - Images
        // - Videos
        // etc.
        // --------------------------------------------

        let body = "";

        details.children().each(function() {
            if (!$(this).hasClass("project-resources")) {
                body += $(this).prop("outerHTML");
            }
        });


        // --------------------------------------------
        // Create modal
        // --------------------------------------------

        const modal = $(`
            <div class="project-modal">

                <div class="project-modal-content">

                    <button
                        class="project-modal-close"
                        aria-label="Close">
                        &times;
                    </button>


                    <h3>${project.find("h3").html()}</h3>


                    <!-- Metadata + Resources -->

                    <div class="project-modal-top">

                        ${meta}

                        ${resources}

                    </div>


                    <!-- Full Project Details -->

                    <div class="project-modal-body">

                        ${body}

                    </div>

                </div>

            </div>
        `);


        // --------------------------------------------
        // Add modal to page
        // --------------------------------------------

        $("body").append(modal);


        // Prevent background scrolling
        $("body").css("overflow", "hidden");


        // --------------------------------------------
        // Close button
        // --------------------------------------------

        modal.find(".project-modal-close").on("click", function() {
            closeProjectModal();
        });


        // --------------------------------------------
        // Close when clicking outside modal
        // --------------------------------------------

        modal.on("click", function(event) {

            if ($(event.target).is(".project-modal")) {
                closeProjectModal();
            }

        });


        // --------------------------------------------
        // Escape key
        // --------------------------------------------

        $(document).off("keydown.projectModal");

        $(document).on("keydown.projectModal", function(event) {

            if (event.key === "Escape") {
                closeProjectModal();
            }

        });

    });


    // --------------------------------------------
    // Close modal function
    // --------------------------------------------

    function closeProjectModal() {

        $(".project-modal").remove();

        // Restore scrolling
        $("body").css("overflow", "");

        // Remove Escape key listener
        $(document).off("keydown.projectModal");

    }

});